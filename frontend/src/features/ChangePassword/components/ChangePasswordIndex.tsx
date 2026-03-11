import { type ReactNode, useState } from "react";
import { useNavigate, useParams } from "react-router";

import Loader from "../../../components/Layout/Loading";
import { useUser } from "../../../components/Providers/useUser";
import StepContent from "../../../components/Wizard/StepContent";
import { authService } from "../../../services/authService";
import type { OtpSentData } from "../../../types/hooks";
import { PAGES } from "../../../utils/constants";
import { getErrorMessage } from "../../../utils/errorUtils";
import { getPageContent } from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { useOtpOperations } from "../../../hooks/useOtpOperations";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import OtpSelection from "../../TransientOtp/components/OtpSelection.jsx";
import OtpVerification from "../../TransientOtp/components/OtpVerification.jsx";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification.jsx";
import { passwordUpdate } from "../api/passwordUpdate";
import Password from "./Password";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation";

type PasswordUpdateStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "passwordChange"
  | "passwordChangedConfirmation";

const defaultPasswordUpdateStep: PasswordUpdateStep = "passwordVerification";

export default function ChangePasswordIndex() {
  const { language } = useParams();
  const resolvedLanguage = language ?? "en";
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const [otpSentResponse, setOtpSentResponse] = useState<OtpSentData | null>(
    null,
  );
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [passwordUpdateStep, setPasswordUpdateStep] =
    useState<PasswordUpdateStep>(defaultPasswordUpdateStep);

  const errorMessage = getErrorMessage(resolvedLanguage, errorCode);
  const pageContentJson = getPageContent(resolvedLanguage, PAGES.otpSelection);
  const navBarContent = getPageContent(resolvedLanguage, "TopNavBar") ?? {};

  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: resolvedLanguage,
  });

  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      if (userPhoneFactors.length === 1) {
        setPasswordUpdateStep("otpValidation");
      } else {
        setPasswordUpdateStep("otpSelection");
      }
    },
  );

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

  const requestOtpCode = async () => {
    if (!userName || !userSelectedMfaFactor) {
      return;
    }

    try {
      const response = await passwordUpdate.firstStep(
        userName,
        userSelectedMfaFactor,
      );
      if (response?.success && response.data) {
        setOtpSentResponse(response.data);
      }
      setErrorCode("");
    } catch (error) {
      const authError = error as { data?: { message?: string } };
      if (authError.data?.message) {
        setErrorCode(authError.data.message);
      }
    }
  };

  const validateOtpCode = async (otpValue: string) => {
    if (!otpSentResponse?.trxnId) {
      return;
    }

    setLocalLoading(true);
    try {
      const response = await passwordUpdate.secondStep(
        otpValue,
        otpSentResponse.trxnId,
      );
      if (response?.success) {
        setPasswordUpdateStep("passwordChange");
      }
      setErrorCode("");
    } catch (error) {
      const authError = error as { data?: { message?: string } };
      if (authError.data?.message) {
        setErrorCode(authError.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true, navBarContent["8"]);

    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url ?? null;

      if (redirectUrl) {
        return;
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
      setLoading(true, navBarContent["9"]);
      window.setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const steps: Record<PasswordUpdateStep, ReactNode> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={() => {
          navigate(backToSecuritySettingsPage);
        }}
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
        fido2Data={[]}
        onSelectFIDO2={() => {}}
        parentPage={PAGES.password}
        onNext={() => {
          setPasswordUpdateStep("otpValidation");
        }}
        onCancel={() => {
          navigate(backToSecuritySettingsPage);
        }}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={requestOtpCode}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          if (userPhoneFactors.length === 1) {
            setPasswordUpdateStep("passwordVerification");
          } else {
            setPasswordUpdateStep("otpSelection");
          }
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={() => {
          navigate(backToSecuritySettingsPage);
        }}
        showTryAnotherWay={userPhoneFactors.length > 1}
      />
    ),
    passwordChange: (
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
    ),
    passwordChangedConfirmation: (
      <PasswordChangedConfirmation
        onNext={() => {
          void logout();
        }}
      />
    ),
  };

  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson?.["11"] ?? ""} />
  ) : (
    <StepContent
      StepComponent={steps[passwordUpdateStep]}
      errorCode={errorCode}
      language={resolvedLanguage}
    />
  );
}
