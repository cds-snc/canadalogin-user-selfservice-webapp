import { useState } from "react";
import Loader from "../../components/Layout/Loading";
import StepContent from "../../components/Wizard/StepContent";
import { useNavigate, useParams } from "react-router";
import { path } from "../../utils/routeHelpers";
import {
  INVALID_OTP_ERROR_CODES,
  PAGES,
  FLOW_TYPES,
} from "../../utils/constants";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../../utils/errorUtils";
import { useOtpAttemptTracking } from "../../hooks/useOtpAttemptTracking";
import PasswordVerification from "../TransientOtp/components/PasswordVerification";
import OtpSelection from "../TransientOtp/components/OtpSelection";
import OtpVerification from "../TransientOtp/components/OtpVerification";
import { usePasswordValidation } from "../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../hooks/usePasskeyOperations";
import { useUser } from "../../components/Providers/useUser";
import { authService } from "../../services/authService";
import { userProfileDispatch } from "../../utils/userProfileDispatch";
import { useFormTracking } from "../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../utils/analyticsConstants";
import { EMAIL_ADDRESS_ANALYTICS } from "../../utils/analyticsConstants";
import VerifyFIDO2Passkey from "../ManageFIDO2/components/VerifyFIDO2Passkey/VerifyFIDO2Passkey";
import EditEmailEnterEmail from "./EditEmailEnterEmail";
import EmailOtpValidation from "./EmailOtpValidation";
import EmailUpdateSuccess from "./EmailUpdateSuccess";
import EmailConfirmUpdate from "./EmailConfirmUpdate";
import type { UserProfile } from "../../types/user";
import type { Fido2Credential } from "../../types/hooks";

type WizardStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "verifyFIDO2Passkey"
  | "enterEmail"
  | "emailOtpValidation"
  | "emailConfirmUpdate"
  | "emailUpdateSuccess";

const EMAIL_PAGE_BY_STEP: Record<WizardStep, string> = {
  passwordVerification: "EditEmailPage",
  otpSelection: "EmailChangeOtpSelection",
  otpValidation: "EmailChangeOtpValidation",
  verifyFIDO2Passkey: "EmailChangePasskeyVerification",
  enterEmail: "EmailChangeEnterEmail",
  emailOtpValidation: "EmailChangeVerifyNewEmail",
  emailConfirmUpdate: "EmailChangeConfirmUpdate",
  emailUpdateSuccess: "EmailChangeSuccess",
};

type EmailFormData = {
  emailAddress: string;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 128;
const NON_ASCII_CHARACTER_REGEX = /[^\u0000-\u007F]/;

const normalizeEmail = (value: string | undefined | null): string =>
  (value || "").trim().toLowerCase();

const getEmailValidationErrorCode = (email: string): string | null => {
  if (!email) {
    return "emailRequired";
  }

  if (email.length > MAX_EMAIL_LENGTH) {
    return "email_too_long";
  }

  if (NON_ASCII_CHARACTER_REGEX.test(email)) {
    return "email_accented_characters";
  }

  if (!EMAIL_REGEX.test(email)) {
    return "invalidEmail";
  }

  return null;
};

type CaughtError = { data?: { message?: string } };

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    "passwordVerification",
  );
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
  const [formData, setFormData] = useState<EmailFormData>({
    emailAddress: "",
  });

  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { userProfile } = state;
  const { id, userName } = (userProfile ?? {}) as Partial<UserProfile>;

  const navigate = useNavigate();

  const backToProfile = path(PAGES.ProfileHome, {
    language: language,
  });
  const { t } = useTranslation("security");

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(wizardStep, EMAIL_PAGE_BY_STEP);

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step:
          userPhoneFactors &&
          userPhoneFactors.length === 1 &&
          fido2Data.length === 0
            ? EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION
            : EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
      });

      if (
        userPhoneFactors &&
        userPhoneFactors.length === 1 &&
        fido2Data.length === 0
      ) {
        const success = await requestOtpCode();
        if (success) {
          setWizardStep("otpValidation");
        }
      } else {
        setWizardStep("otpSelection");
      }
    },
    false,
    (message) => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.VERIFY_PASSWORD,
        error: message,
      });
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.VERIFY_PASSWORD,
      flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
    });
    await validatePassword(password);
  };

  const handleFormChange = (ev: CustomEvent<string>) => {
    const target = ev.target as HTMLInputElement | null;
    const name = target?.name;
    const value = target?.value;

    if (name) {
      setFormData((prev) => ({
        ...prev,
        [name]: value ?? "",
      }));
    }
  };

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    otpLoading: localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode,
    setOtpLoading: setLocalLoading,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToProfile,
    allowEmptyFactors: true,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    enabled: true,
    setErrorCode,
  });

  // Get user profile dispatch method
  const { updateProfileSuccess } = userProfileDispatch(dispatch);

  const handleBackToProfile = async () => {
    navigate(backToProfile);
  };

  const handleBackToEnterEmail = async () => {
    setErrorCode("");
    setCustomErrorMessage("");
    resetAttempts();
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
      flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
    });
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
    });
    setWizardStep("enterEmail");
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const response = await authService.logout();

      const redirectUrl =
        (response as { data?: { redirect_url?: string } })?.data
          ?.redirect_url ?? null;

      if (redirectUrl) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.LOGOUT,
        });
        return;
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.LOGOUT,
        });
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.LOGOUT,
      });
      setLocalLoading(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const handleEnterEmailSubmit = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
      flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
    });

    const normalizedNewEmail = normalizeEmail(formData.emailAddress);
    const emailValidationErrorCode =
      getEmailValidationErrorCode(normalizedNewEmail);

    if (emailValidationErrorCode) {
      setErrorCode(emailValidationErrorCode);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
        error: emailValidationErrorCode,
      });
      return;
    }

    // Send OTP to the new email address, then navigate to verification step
    setErrorCode("");
    const success = await requestOtpCode({
      otpType: FLOW_TYPES.email,
      destination: normalizedNewEmail,
    });
    if (success) {
      setWizardStep("emailOtpValidation");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
      });
    }
  };

  const handleEmailChangeWithOtp = async () => {
    try {
      setErrorCode("");

      const normalizedNewEmail = normalizeEmail(formData.emailAddress);
      const emailValidationErrorCode =
        getEmailValidationErrorCode(normalizedNewEmail);

      if (emailValidationErrorCode) {
        setErrorCode(emailValidationErrorCode);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: emailValidationErrorCode,
        });
        return;
      }

      if (!userOtpValue || !otpSentResponse?.trxnId) {
        setErrorCode("OTP_VERIFICATION_REQUIRED");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "OTP_VERIFICATION_REQUIRED",
        });
        return;
      }

      const response = await authService.update_email_with_otp(
        normalizedNewEmail,
        userOtpValue,
        otpSentResponse.trxnId,
        FLOW_TYPES.email,
      );

      if (response && response.success && response.data) {
        updateProfileSuccess(
          response.data as Parameters<typeof updateProfileSuccess>[0],
        );
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.SUCCESS,
        });
        setWizardStep("emailUpdateSuccess");
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "FAILED_TO_UPDATE_EMAIL",
        });
      }
    } catch (error) {
      console.error("Error updating email address with OTP:", error);
      const apiError = error as CaughtError;
      const message = apiError?.data?.message ?? "FAILED_TO_UPDATE_EMAIL";
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
        error: message,
      });
      setErrorCode(message);
      if (
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          apiError?.data?.message ?? "",
        )
      ) {
        setWizardStep("emailOtpValidation");
      }
    }
  };

  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const errorMessage =
    customErrorMessage || getErrorMessage(language, errorCode);
  const { getDisplayError, resetAttempts, isMaxAttemptsReached } =
    useOtpAttemptTracking(errorCode);
  const otpDisplayError = getDisplayError(errorMessage);

  const steps: Record<WizardStep, React.ReactElement> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={handleBackToProfile}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.editEmailPage}
      />
    ),
    otpSelection: (
      <OtpSelection
        fido2Data={fido2Data}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        onNext={() => {
          void (async () => {
            const success = await requestOtpCode();
            if (success) {
              setWizardStep("otpValidation");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
          })();
        }}
        onSelectFIDO2={(passkey) => {
          setSelected2FAPasskey(passkey);
          setWizardStep("verifyFIDO2Passkey");
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={handleBackToProfile}
      />
    ),
    verifyFIDO2Passkey: (
      <VerifyFIDO2Passkey
        submitAttestationResult={true}
        assertionOptionsRequest={{ userVerification: "required" }}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        selectedPasskey={selected2FAPasskey}
        onCallback={() => {
          setWizardStep("enterEmail");
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
          });
        }}
        onTryAnotherWayHandler={() => {
          setSelected2FAPasskey(null);
          setWizardStep("otpSelection");
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
          });
        }}
      />
    ),
    otpValidation: (
      <OtpVerification
        userSelectedMfaFactor={userSelectedMfaFactor!}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
          });
          return requestOtpCode();
        }}
        validateOtpCode={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
          });
          return validateOtpCode(
            userOtpValue,
            () => {
              setWizardStep("enterEmail");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
              });
            },
            undefined,
            (message) => {
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_END,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
                error: message,
              });
            },
          );
        }}
        onBack={() => {
          const prevStep =
            userPhoneFactors &&
            userPhoneFactors.length === 1 &&
            fido2Data.length === 0
              ? "passwordVerification"
              : "otpSelection";
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
          });
          setWizardStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        setErrorMessage={setCustomErrorMessage}
        errorMessage={errorMessage}
        onCancel={handleBackToProfile}
        showTryAnotherWay={
          (userPhoneFactors != null && userPhoneFactors.length > 1) ||
          fido2Data.length > 0
        }
      />
    ),
    enterEmail: (
      <EditEmailEnterEmail
        onCancel={handleBackToProfile}
        onSubmit={handleEnterEmailSubmit}
        handleFormChange={handleFormChange}
        formData={formData}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
      />
    ),
    emailOtpValidation: (
      <EmailOtpValidation
        onSubmit={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
          });

          if (userOtpValue && userOtpValue.trim()) {
            setWizardStep("emailConfirmUpdate");
            trackEvent({
              event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
              step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
            });
          } else {
            setErrorCode("OTP_REQUIRED");
            trackEvent({
              event: GA_FORM_EVENTS.FORM_STEP_END,
              step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
              error: "OTP_REQUIRED",
            });
          }
        }}
        onCancel={handleBackToProfile}
        formData={formData}
        setFormData={setFormData}
        errorMessage={otpDisplayError}
        userOtpValue={userOtpValue}
        handleChange={handleSetUserOtpValue}
        requestOtpCode={async () => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
          });
          return requestOtpCode({
            otpType: FLOW_TYPES.email,
            destination: formData.emailAddress,
          });
        }}
        otpExpiry={otpSentResponse?.expiry}
        otpCreatedAt={otpSentResponse?.created}
        onBack={handleBackToEnterEmail}
        isMaxAttemptsReached={isMaxAttemptsReached}
        resetAttempts={resetAttempts}
      />
    ),
    emailConfirmUpdate: (
      <EmailConfirmUpdate
        onSubmit={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
          });
          return handleEmailChangeWithOtp();
        }}
        onCancel={handleBackToProfile}
        formData={formData}
      />
    ),
    emailUpdateSuccess: (
      <EmailUpdateSuccess
        newEmailAddress={formData.emailAddress}
        onBackToProfile={handleBackToProfile}
        onSignOut={(e) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.LOGOUT,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.LOGOUT,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
          });
          return handleSignOut(e);
        }}
      />
    ),
  };

  return localLoading || validatePasswordLoading || passkeyLoading ? (
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      errorMessage={otpDisplayError}
      language={language}
    />
  );
}
