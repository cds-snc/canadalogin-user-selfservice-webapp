import { useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import Loader from "../../../components/Layout/Loading";

import Password from "./Password";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation";

import { PAGES } from "../../../utils/constants";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { getErrorMessage } from "../../../utils/errorUtils";
import { authService } from "../../../services/authService";

import { getPageContent } from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import OtpSelection from "../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../TransientOtp/components/OtpVerification";
import { passwordUpdate } from "../api/passwordUpdate";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../hooks/useOtpOperations";
import { useFormTracking } from "../../../hooks/useFormTracking";
import type { AuthServiceError } from "../../../types/services";
import type { PasswordUpdateTransactionData } from "../api/passwordUpdate";

const defaultPasswordUpdateStep = "passwordVerification";

type PasswordUpdateStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "passwordChange"
  | "passwordChangedConfirmation";

function getApiErrorMessage(error: unknown): string | undefined {
  if (!error || typeof error !== "object") {
    return undefined;
  }

  const authError = error as AuthServiceError;
  return authError.data?.message ?? authError.response?.data?.message;
}

export default function ChangePasswordIndex() {
  const { language } = useParams<{ language: string }>();
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const [otpSentResponse, setOtpSentResponse] =
    useState<PasswordUpdateTransactionData | null>(null);
  const [errorCode, setErrorCode] = useState("");

  const errorMessage = getErrorMessage(language, errorCode);

  const [userPasswordValue, setUserPasswordValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection) ?? {};
  const navBarContent = getPageContent(language, "TopNavBar") ?? {};

  const [passwordUpdateStep, setPasswordUpdateStep] =
    useState<PasswordUpdateStep>(defaultPasswordUpdateStep);

  // Initialize form tracking
  const { trackStepChange, trackStepAttempt, trackStepError, trackApiCall } =
    useFormTracking({
      formId: "password_change",
      page: "change_password",
      initialStep: passwordUpdateStep,
    });

  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      trackStepChange(
        userPhoneFactors && userPhoneFactors.length === 1 ? "otpValidation" : "otpSelection",
        "verify_password"
      );

      if (userPhoneFactors && userPhoneFactors.length === 1) {
        setPasswordUpdateStep("otpValidation");
      } else {
        setPasswordUpdateStep("otpSelection");
      }
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackStepAttempt("password_verification_initiated", "verify_password");
    await validatePassword(password);
  };

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpLoading: localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    setOtpLoading: setLocalLoading,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
  });

  // Custom requestOtpCode for password change flow using passwordUpdate API
  const requestOtpCode = async () => {
    try {
      trackStepAttempt("password_otp_request_initiated", "password_otp");

      const response = await trackApiCall(
        "password_update_first_step",
        "POST",
        () => passwordUpdate.firstStep(userName, userSelectedMfaFactor),
        "password_otp"
      );

      if (response?.success && response.data) {
        setOtpSentResponse(response.data);
      }
      setErrorCode("");
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
        trackStepError(`password_otp_request_failed: ${message}`, "password_otp");
      }
    }
  };

  // Custom validateOtpCode for password change flow using passwordUpdate API
  const validateOtpCode = async (userOtp: string) => {
    if (!otpSentResponse?.trxId) {
      return;
    }

    setLocalLoading(true);
    trackStepAttempt("password_otp_validation_initiated", "password_otp");

    try {
      const response = await trackApiCall(
        "password_update_second_step",
        "POST",
        () => passwordUpdate.secondStep(userOtp, otpSentResponse.trxId),
        "password_otp"
      );

      if (response?.success) {
        setPasswordUpdateStep("passwordChange");
        trackStepChange("passwordChange", "password_otp");
      }
      setErrorCode("");
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
        trackStepError(`password_otp_validation_failed: ${message}`, "password_otp");
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true, navBarContent["8"]); // Use logout loading text
    trackStepAttempt("logout_initiated", "logout");

    try {
      const response = await trackApiCall(
        "logout",
        "POST",
        () => authService.logout(),
        "logout"
      );

      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        return;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      trackStepError("logout_failed", "logout");
      setLoading(true, navBarContent["9"]);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={() => navigate(backToSecuritySettingsPage)}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.password}
      />
    ),
    otpSelection: (
      <OtpSelection
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        onNext={() => {
          trackStepChange("otpValidation", "phone_selection");
          setPasswordUpdateStep("otpValidation");
        }}
        onCancel={() => navigate(backToSecuritySettingsPage)}
        parentPage={PAGES.password}
      />
    ),
    otpValidation: userSelectedMfaFactor ? (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={requestOtpCode}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          const prevStep = userPhoneFactors.length === 1 
            ? "passwordVerification" 
            : "otpSelection";
          trackStepChange(prevStep, "back");
          setPasswordUpdateStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={() => navigate(backToSecuritySettingsPage)}
        showTryAnotherWay={userPhoneFactors.length > 1}
      />
    ) : null,
    passwordChange: otpSentResponse ? (
      <Password
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        setLocalLoading={setLocalLoading}
        otpSentResponse={otpSentResponse}
        userOtpValue={userOtpValue}
        onNext={() => {
          trackStepChange("passwordChangedConfirmation", "password_change");
          setPasswordUpdateStep("passwordChangedConfirmation");
        }}
      />
    ) : null,
    passwordChangedConfirmation: (
      <PasswordChangedConfirmation
        onNext={() => {
          logout();
        }}
      />
    ),
  };

  const stepComponent = steps[passwordUpdateStep] as ReactNode;

  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={stepComponent}
      errorCode={errorCode}
      language={language}
    />
  );
}
