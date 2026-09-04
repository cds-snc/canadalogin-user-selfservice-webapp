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
import { mergeOtpSentResponseWithMetadata } from "../../utils/otpMetadata";
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

type CaughtError = {
  status?: number;
  data?: {
    message?: string;
    created?: string;
    expiry?: string;
    trxnId?: string;
    attempts?: number;
    retries?: number;
  };
  response?: {
    status?: number;
    data?: {
      message?: string;
      created?: string;
      expiry?: string;
      trxnId?: string;
      attempts?: number;
      retries?: number;
    };
  };
};

const hasRemainingOtpAttempts = (payload?: {
  retries?: number;
  attempts?: number;
}): boolean => {
  const retries = payload?.retries;
  const attempts = payload?.attempts;

  if (
    retries === undefined ||
    retries === null ||
    attempts === undefined ||
    attempts === null
  ) {
    return false;
  }

  return retries - attempts > 0;
};

const EXISTING_EMAIL_CONFLICT_ERROR_CODE = "email_already_associated";
const UPSTREAM_HTTP_STATUS_CODE_REGEX = /status code:\s*(\d{3})/i;

const getUpstreamStatusCodeFromMessage = (
  message: string | undefined,
): number | null => {
  if (!message) {
    return null;
  }

  const match = message.match(UPSTREAM_HTTP_STATUS_CODE_REGEX);
  if (!match?.[1]) {
    return null;
  }

  const parsedStatusCode = Number.parseInt(match[1], 10);
  return Number.isNaN(parsedStatusCode) ? null : parsedStatusCode;
};

const resolveEmailUpdateErrorCode = (error: CaughtError): string => {
  const payload = error?.data ?? error?.response?.data;
  const message = payload?.message ?? "";
  const directStatusCode = error?.status ?? error?.response?.status;
  const upstreamStatusCode = getUpstreamStatusCodeFromMessage(message);

  if (directStatusCode === 409 || upstreamStatusCode === 409) {
    return EXISTING_EMAIL_CONFLICT_ERROR_CODE;
  }

  return message || "FAILED_TO_UPDATE_EMAIL";
};

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    "passwordVerification",
  );
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
  const [isEmailOtpMaxAttemptsReached, setIsEmailOtpMaxAttemptsReached] =
    useState(false);
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
      if (
        userPhoneFactors &&
        userPhoneFactors.length === 1 &&
        fido2Data.length === 0
      ) {
        const success = await requestOtpCode();
        if (success) {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
          });
          setWizardStep("otpValidation");
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
          });
        }
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_START,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
          flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
        });
        setWizardStep("otpSelection");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
        });
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
    setOtpSentResponse,
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
    handleSetUserOtpValue("");
    setErrorCode("");
    setCustomErrorMessage("");
    setIsEmailOtpMaxAttemptsReached(false);
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
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_START,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
        flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
      });
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
        setIsEmailOtpMaxAttemptsReached(false);
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
        setIsEmailOtpMaxAttemptsReached(false);
        setCustomErrorMessage("");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.SUCCESS,
        });
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_START,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.SUCCESS,
          flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
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
      const apiErrorPayload = apiError?.data ?? apiError?.response?.data;
      setOtpSentResponse((prev) =>
        mergeOtpSentResponseWithMetadata(prev, {
          created: apiErrorPayload?.created,
          expiry: apiErrorPayload?.expiry,
          trxnId: apiErrorPayload?.trxnId,
        }),
      );

      const message = resolveEmailUpdateErrorCode(apiError);
      const retries = apiErrorPayload?.retries;
      const attempts = apiErrorPayload?.attempts;

      setIsEmailOtpMaxAttemptsReached(false);
      setCustomErrorMessage("");

      if (
        retries !== undefined &&
        retries !== null &&
        attempts !== undefined &&
        attempts !== null
      ) {
        const remaining = retries - attempts;
        const isMaxAttemptsReached = remaining <= 0;
        setIsEmailOtpMaxAttemptsReached(isMaxAttemptsReached);
        setCustomErrorMessage(
          isMaxAttemptsReached
            ? t("Error.otp_max_attempts", { ns: "common" })
            : t("Error.otp_invalid_attempts", {
                ns: "common",
                count: remaining,
              }),
        );
      }

      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
        error: message,
      });
      setErrorCode(message);

      const shouldNavigateBackToEmailOtpValidation =
        message === EXISTING_EMAIL_CONFLICT_ERROR_CODE ||
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          apiErrorPayload?.message ?? "",
        );

      if (shouldNavigateBackToEmailOtpValidation) {
        setWizardStep("emailOtpValidation");
      }
    }
  };

  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const otpDisplayError =
    customErrorMessage || getErrorMessage(language, errorCode);
  const errorMessage = otpDisplayError;

  const resetOtpAttemptState = () => {
    setIsEmailOtpMaxAttemptsReached(false);
  };

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
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_START,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
                flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
                type: userSelectedMfaFactor?.type,
              });
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
          return requestOtpCode();
        }}
        validateOtpCode={(otpValue) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
          });
          const handleOtpValidationError = (error: unknown) => {
            const apiError = error as CaughtError;
            const payload = apiError?.data ?? apiError?.response?.data;

            if (hasRemainingOtpAttempts(payload)) {
              handleSetUserOtpValue(otpValue);
            }

            return Promise.reject(error);
          };

          try {
            const validationResult = validateOtpCode(
              otpValue,
              () => {
                setCustomErrorMessage("");
                resetOtpAttemptState();
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

            return Promise.resolve(validationResult).catch(
              handleOtpValidationError,
            );
          } catch (error) {
            return handleOtpValidationError(error);
          }
        }}
        onBack={() => {
          handleSetUserOtpValue("");
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
            trackEvent({
              event: GA_FORM_EVENTS.FORM_STEP_START,
              step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
              flow: EMAIL_ADDRESS_ANALYTICS.FLOW_ID,
            });
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
          setIsEmailOtpMaxAttemptsReached(false);
          setCustomErrorMessage("");
          return requestOtpCode({
            otpType: FLOW_TYPES.email,
            destination: formData.emailAddress,
          });
        }}
        otpExpiry={otpSentResponse?.expiry}
        otpCreatedAt={otpSentResponse?.created}
        onBack={handleBackToEnterEmail}
        isMaxAttemptsReached={isEmailOtpMaxAttemptsReached}
        resetAttempts={resetOtpAttemptState}
      />
    ),
    emailConfirmUpdate: (
      <EmailConfirmUpdate
        onSubmit={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
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
