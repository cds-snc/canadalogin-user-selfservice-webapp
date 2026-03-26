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

  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) setPasswordUpdateStep("otpValidation");
      } else {
        setPasswordUpdateStep("otpSelection");
      }
    },
  );

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userSelectedMfaFactorRef,
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
  const requestOtpCode = async (): Promise<boolean> => {
    try {
      const response = await passwordUpdate.firstStep(
        userName,
        userSelectedMfaFactorRef.current,
      );
      if (response?.success && response.data) {
        setOtpSentResponse(response.data);
        setErrorCode("");
        return true;
      }
      return false;
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
      }
      return false;
    }
  };

  // Custom validateOtpCode for password change flow using passwordUpdate API
  const validateOtpCode = async (userOtp: string) => {
    if (!otpSentResponse?.trxId) {
      return;
    }

    setLocalLoading(true);
    try {
      const response = await passwordUpdate.secondStep(
        userOtp,
        otpSentResponse.trxId,
      );
      if (response?.success) {
        setPasswordUpdateStep("passwordChange");
      }
      setErrorCode("");
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true, navBarContent["8"]); // Use logout loading text

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      // Check if response has redirect_url
      if (redirectUrl) {
        // form been submitted in authService.logout
        return;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Update loading text to show error
      setLoading(true, navBarContent["9"]);
      // Redirect after error
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
        validatePassword={validatePassword}
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
          void (async () => {
            const success = await requestOtpCode();
            if (success) setPasswordUpdateStep("otpValidation");
          })();
        }}
        onCancel={() => navigate(backToSecuritySettingsPage)}
        parentPage={PAGES.password}
      />
    ),
    otpValidation: userSelectedMfaFactor ? (
      <OtpVerification
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={requestOtpCode}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          // If there's only one MFA factor, go back to password verification.
          if (userPhoneFactors.length === 1) {
            setPasswordUpdateStep("passwordVerification");
            return;
          }

          setPasswordUpdateStep("otpSelection");
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
