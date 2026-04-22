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
import { useOtpAttemptTracking } from "../../../hooks/useOtpAttemptTracking";

import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import OtpSelection from "../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../TransientOtp/components/OtpVerification";
import { passwordUpdate } from "../api/passwordUpdate";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../hooks/useOtpOperations";
import { useFormTracking } from "../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../../utils/analyticsConstants";
import { CHANGE_PASSWORD_ANALYTICS } from "../../../utils/analyticsConstants";
import type { AuthServiceError } from "../../../types/services";
import type { PasswordUpdateTransactionData } from "../api/passwordUpdate";

const defaultPasswordUpdateStep = "passwordVerification";

type PasswordUpdateStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "passwordChange"
  | "passwordChangedConfirmation";

const PASSWORD_CHANGE_PAGE_BY_STEP: Record<PasswordUpdateStep, string> = {
  passwordVerification: "PasswordChangeVerifyIdentity",
  otpSelection: "PasswordChangeOtpSelection",
  otpValidation: "PasswordChangeOtpValidation",
  passwordChange: "PasswordChangeEnterNewPassword",
  passwordChangedConfirmation: "PasswordChangeSuccess",
};

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
  const { getDisplayError, resetAttempts, isMaxAttemptsReached } =
    useOtpAttemptTracking(errorCode);
  const otpDisplayError = getDisplayError(errorMessage);

  const [userPasswordValue, setUserPasswordValue] = useState("");
  const { t } = useTranslation(["security", "layout"]);

  const [passwordUpdateStep, setPasswordUpdateStep] =
    useState<PasswordUpdateStep>(defaultPasswordUpdateStep);

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: CHANGE_PASSWORD_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(passwordUpdateStep, PASSWORD_CHANGE_PAGE_BY_STEP);

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
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step:
          userPhoneFactors && userPhoneFactors.length === 1
            ? CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION
            : CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_SELECTION,
      });
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) {
          setPasswordUpdateStep("otpValidation");
        }
      } else {
        setPasswordUpdateStep("otpSelection");
      }
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: CHANGE_PASSWORD_ANALYTICS.STEPS.VERIFY_PASSWORD,
    });
    await validatePassword(password);
  };

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
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
        });
        setErrorCode("");
        return true;
      }
      return false;
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
          error: message,
        });
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
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
        });
        setPasswordUpdateStep("passwordChange");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.CHANGE_PASSWORD,
        });
      }
      setErrorCode("");
    } catch (err) {
      const message = getApiErrorMessage(err);
      if (message) {
        setErrorCode(message);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
          error: message,
        });
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true, t("TopNavBar.signingOut", { ns: "layout" }));

    try {
      const response = await authService.logout();

      const redirectUrl = response?.data?.redirect_url || null;

      if (redirectUrl) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.LOGOUT,
        });
        return;
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.LOGOUT,
        });
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: CHANGE_PASSWORD_ANALYTICS.STEPS.LOGOUT,
        error: errorMessage,
      });
      setLoading(true, t("TopNavBar.signOutFailed", { ns: "layout" }));
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
          void (async () => {
            const success = await requestOtpCode();
            if (success) {
              setPasswordUpdateStep("otpValidation");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
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
        requestOtpCode={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          return requestOtpCode();
        }}
        validateOtpCode={(userOtp) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          return validateOtpCode(userOtp);
        }}
        onBack={() => {
          const prevStep =
            userPhoneFactors.length === 1
              ? "passwordVerification"
              : "otpSelection";
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_SELECTION,
          });
          setPasswordUpdateStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        errorMessage={otpDisplayError}
        onCancel={() => navigate(backToSecuritySettingsPage)}
        showTryAnotherWay={userPhoneFactors.length > 1}
        isMaxAttemptsReached={isMaxAttemptsReached}
        resetAttempts={resetAttempts}
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
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.SUCCESS,
          });
          setPasswordUpdateStep("passwordChangedConfirmation");
        }}
      />
    ) : null,
    passwordChangedConfirmation: (
      <PasswordChangedConfirmation
        onNext={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.LOGOUT,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.LOGOUT,
          });
          logout();
        }}
      />
    ),
  };

  const stepComponent = steps[passwordUpdateStep] as ReactNode;

  return localLoading || validatePasswordLoading ? (
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={stepComponent}
      errorCode={errorCode}
      errorMessage={otpDisplayError}
      language={language}
    />
  );
}
