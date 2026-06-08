import { useState } from "react";
import type { ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import Loader from "../../../components/Layout/Loading";

import Password from "./Password";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation";

import { PAGES } from "../../../utils/constants";
import { FLOW_TYPES } from "../../../utils/constants";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { getErrorMessage } from "../../../utils/errorUtils";
import { authService } from "../../../services/authService";

import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import OtpSelection from "../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../TransientOtp/components/OtpVerification";
import { passwordUpdate } from "../api/passwordUpdate";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { usePasswordAttemptTracking } from "../../../hooks/usePasswordAttemptTracking";
import { useOtpOperations } from "../../../hooks/useOtpOperations";
import { useOtpAttemptTracking } from "../../../hooks/useOtpAttemptTracking";
import { useFormTracking } from "../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../../utils/analyticsConstants";
import { CHANGE_PASSWORD_ANALYTICS } from "../../../utils/analyticsConstants";
import type { AuthServiceError } from "../../../types/services";
import type { PasswordUpdateTransactionData } from "../api/passwordUpdate";
import type { OtpFactor } from "../../../types/hooks";

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

function normalizePasswordUpdateTransaction(
  data: PasswordUpdateTransactionData,
): PasswordUpdateTransactionData {
  return {
    ...data,
    expiry: data.expiry ?? data.expiryTime ?? null,
  };
}

export default function ChangePasswordIndex() {
  const { language } = useParams<{ language: string }>();
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);
  const [otpSentResponse, setOtpSentResponse] =
    useState<PasswordUpdateTransactionData | null>(null);
  const [errorCode, setErrorCode] = useState("");
  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const {
    getDisplayError: getPasswordDisplayError,
    resetAttempts: resetPasswordAttempts,
  } = usePasswordAttemptTracking(errorCode);
  const { getDisplayError: getOtpDisplayError, resetAttempts } =
    useOtpAttemptTracking(errorCode);
  const trackedPasswordErrorMessage = getPasswordDisplayError(
    getErrorMessage(language, errorCode),
  );
  const trackedOtpErrorMessage = getOtpDisplayError(
    trackedPasswordErrorMessage,
  );
  const errorMessage = customErrorMessage || trackedOtpErrorMessage;

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
      // If there are no phone MFA factors, skip OTP selection and go directly to email OTP validation
      if (!userPhoneFactors || userPhoneFactors.length === 0) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
        });
        const success = await requestEmailOtpCode();
        if (success) {
          setPasswordUpdateStep("otpValidation");
        }
        return;
      }

      // Always show OTP selection so user can choose between phone and email
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_SELECTION,
      });
      setPasswordUpdateStep("otpSelection");
    },
    false,
    (message) => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: CHANGE_PASSWORD_ANALYTICS.STEPS.VERIFY_PASSWORD,
        error: message,
      });
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    resetPasswordAttempts();
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
    setUserSelectedMfaFactor,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
  });

  // Create an email factor for the email OTP option
  const emailFactor: OtpFactor = {
    id: "",
    type: FLOW_TYPES.email,
    destination: userName ?? "",
  };

  // Request OTP code via email for the password change flow
  const requestEmailOtpCode = async (): Promise<boolean> => {
    setUserSelectedMfaFactor(emailFactor);
    userSelectedMfaFactorRef.current = emailFactor;
    try {
      const response = await passwordUpdate.firstStep(userName, emailFactor);

      if (response?.success && response.data) {
        setOtpSentResponse(normalizePasswordUpdateTransaction(response.data));
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

  // Custom requestOtpCode for password change flow using passwordUpdate API
  const requestOtpCode = async (): Promise<boolean> => {
    try {
      const response = await passwordUpdate.firstStep(
        userName,
        userSelectedMfaFactorRef.current,
      );

      if (response?.success && response.data) {
        setOtpSentResponse(normalizePasswordUpdateTransaction(response.data));
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
      const errObj = err as { data?: { retries?: number } };
      const hasRetries =
        errObj?.data?.retries !== undefined && errObj?.data?.retries !== null;
      if (hasRetries) {
        // Re-throw so OtpVerification can display "X retries remaining"
        throw err;
      }
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
        emailAddress={userName}
        onSelectEmail={() => {
          void (async () => {
            const success = await requestEmailOtpCode();
            if (success) {
              setPasswordUpdateStep("otpValidation");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
          })();
        }}
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
          if (userSelectedMfaFactor.type === FLOW_TYPES.email) {
            return requestEmailOtpCode();
          }
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
          const hasPhoneFactors = userPhoneFactors.length > 0;
          const prevStep = hasPhoneFactors
            ? "otpSelection"
            : "passwordVerification";
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: CHANGE_PASSWORD_ANALYTICS.STEPS.OTP_SELECTION,
          });
          setPasswordUpdateStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        setErrorMessage={setCustomErrorMessage}
        errorMessage={errorMessage}
        resetAttempts={resetAttempts}
        otpExpiry={otpSentResponse?.expiry}
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
      errorMessage={errorMessage}
      language={language}
    />
  );
}
