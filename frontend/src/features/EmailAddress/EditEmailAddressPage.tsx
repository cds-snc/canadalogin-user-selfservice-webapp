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
import { useUser } from "../../components/Providers/useUser";
import { authService } from "../../services/authService";
import { userProfileDispatch } from "../../utils/userProfileDispatch";
import { useFormTracking } from "../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../utils/analyticsConstants";
import { EMAIL_ADDRESS_ANALYTICS } from "../../utils/analyticsConstants";
import EditEmailEnterEmail from "./EditEmailEnterEmail";
import EmailOtpValidation from "./EmailOtpValidation";
import EmailUpdateSuccess from "./EmailUpdateSuccess";
import EmailConfirmUpdate from "./EmailConfirmUpdate";
import type { UserProfile } from "../../types/user";

const EMAIL_PAGE_BY_STEP: Record<string, string> = {
  passwordVerification: "EditEmailPage",
  otpSelection: "EmailChangeOtpSelection",
  otpValidation: "EmailChangeOtpValidation",
  enterEmail: "EmailChangeEnterEmail",
  emailOtpValidation: "EmailChangeVerifyNewEmail",
  emailConfirmUpdate: "EmailChangeConfirmUpdate",
  emailUpdateSuccess: "EmailChangeSuccess",
};

type EmailFormData = {
  emailAddress: string;
};

type CaughtError = { data?: { message?: string } };

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState("passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
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
          userPhoneFactors && userPhoneFactors.length === 1
            ? EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION
            : EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
      });

      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) {
          setWizardStep("otpValidation");
        }
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.VERIFY_PASSWORD,
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
  });

  // Get user profile dispatch method
  const { updateProfileSuccess } = userProfileDispatch(dispatch);

  const handleBackToProfile = async () => {
    navigate(backToProfile);
  };

  const handleBackToEnterEmail = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
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
    });

    if (!formData.emailAddress || !formData.emailAddress.trim()) {
      setErrorCode("EMAIL_REQUIRED");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
        error: "EMAIL_REQUIRED",
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
      setErrorCode("INVALID_EMAIL");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
        error: "INVALID_EMAIL",
      });
      return;
    }

    // Send OTP to the new email address, then navigate to verification step
    setErrorCode("");
    const success = await requestOtpCode({
      otpType: FLOW_TYPES.email,
      destination: formData.emailAddress,
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

      if (!formData.emailAddress || !formData.emailAddress.trim()) {
        setErrorCode("EMAIL_REQUIRED");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "EMAIL_REQUIRED",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailAddress)) {
        setErrorCode("INVALID_EMAIL");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: EMAIL_ADDRESS_ANALYTICS.STEPS.CONFIRM_UPDATE,
          error: "INVALID_EMAIL",
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
        formData.emailAddress,
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

  const errorMessage = getErrorMessage(language, errorCode);

  const steps: Record<string, React.ReactElement> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={handleBackToProfile}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addMFAPage}
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
              setWizardStep("otpValidation");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
          })();
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={handleBackToProfile}
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
          });
          return requestOtpCode();
        }}
        validateOtpCode={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          return validateOtpCode(userOtpValue, (response) => {
            if ((response as { success?: boolean })?.success) {
              setWizardStep("enterEmail");
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.ENTER_EMAIL,
              });
            } else {
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_END,
                step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
          });
        }}
        onBack={() => {
          const prevStep =
            userPhoneFactors && userPhoneFactors.length === 1
              ? "passwordVerification"
              : "otpSelection";
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.OTP_SELECTION,
          });
          setWizardStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={handleBackToProfile}
        showTryAnotherWay={
          userPhoneFactors != null && userPhoneFactors.length > 1
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
        errorMessage={errorMessage}
        userOtpValue={userOtpValue}
        handleChange={handleSetUserOtpValue}
        requestOtpCode={async () => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: EMAIL_ADDRESS_ANALYTICS.STEPS.EMAIL_OTP_VALIDATION,
          });
          await requestOtpCode({
            otpType: FLOW_TYPES.email,
            destination: formData.emailAddress,
          });
        }}
        onBack={handleBackToEnterEmail}
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
          });
          return handleSignOut(e);
        }}
      />
    ),
  };

  return localLoading || validatePasswordLoading ? (
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
