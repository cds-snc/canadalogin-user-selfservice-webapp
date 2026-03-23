import { useState } from "react";
import Loader from "../../components/Layout/Loading";
import StepContent from "../../components/Wizard/StepContent";
import { useNavigate, useParams } from "react-router";
import { path } from "../../utils/routeHelpers";
import { PAGES, FLOW_TYPES } from "../../utils/constants";
import { getPageContent } from "../../utils/functions";
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
import EditEmailEnterEmail from "./EditEmailEnterEmail";
import EmailOtpValidation from "./EmailOtpValidation";
import EmailUpdateSuccess from "./EmailUpdateSuccess";
import EmailConfirmUpdate from "./EmailConfirmUpdate";
import type { UserProfile } from "../../types/user";

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
  const pageContentJson = getPageContent(language, PAGES.otpSelection) ?? {};

  // Initialize form tracking
  const { trackStepChange, trackStepAttempt, trackStepError, trackApiCall } =
    useFormTracking({
      formId: "email_address_update",
      page: "edit_email",
      initialStep: wizardStep,
    });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      trackStepChange(
        userPhoneFactors && userPhoneFactors.length === 1
          ? "otpValidation"
          : "otpSelection",
        "verify_password",
      );

      if (userPhoneFactors && userPhoneFactors.length === 1) {
        setWizardStep("otpValidation");
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackStepAttempt("password_verification_initiated", "verify_password");
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
    trackStepChange("enterEmail", "back");
    setWizardStep("enterEmail");
  };

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      trackStepAttempt("sign_out_initiated", "logout");

      const response = await trackApiCall(
        "logout",
        "POST",
        () => authService.logout(),
        "logout",
      );

      const redirectUrl =
        (response as { data?: { redirect_url?: string } })?.data
          ?.redirect_url ?? null;

      if (redirectUrl) {
        return;
      } else {
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      trackStepError("sign_out_failed", "logout");
      setLocalLoading(true);
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const handleEnterEmailSubmit = async () => {
    trackStepAttempt("email_entry_submit_initiated", "enter_email");

    if (!formData.emailAddress || !formData.emailAddress.trim()) {
      setErrorCode("EMAIL_REQUIRED");
      trackStepError("email_validation_failed: EMAIL_REQUIRED", "enter_email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
      setErrorCode("INVALID_EMAIL");
      trackStepError("email_validation_failed: INVALID_EMAIL", "enter_email");
      return;
    }

    setErrorCode("");
    setWizardStep("emailOtpValidation");
    trackStepChange("emailOtpValidation", "enter_email");
  };

  const handleEmailChangeWithOtp = async () => {
    try {
      setErrorCode("");
      trackStepAttempt("email_update_submit_initiated", "update_email");

      if (!formData.emailAddress || !formData.emailAddress.trim()) {
        setErrorCode("EMAIL_REQUIRED");
        trackStepError("email_update_failed: EMAIL_REQUIRED", "update_email");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailAddress)) {
        setErrorCode("INVALID_EMAIL");
        trackStepError("email_update_failed: INVALID_EMAIL", "update_email");
        return;
      }

      if (!userOtpValue || !otpSentResponse?.trxnId) {
        setErrorCode("OTP_VERIFICATION_REQUIRED");
        trackStepError(
          "email_update_failed: OTP_VERIFICATION_REQUIRED",
          "update_email",
        );
        return;
      }

      const response = await trackApiCall(
        "update_email_with_otp",
        "PATCH",
        async () => {
          const result = await authService.update_email_with_otp(
            formData.emailAddress,
            userOtpValue,
            otpSentResponse.trxnId,
            FLOW_TYPES.email,
          );
          return result;
        },
        "update_email",
      );

      if (response && response.success && response.data) {
        updateProfileSuccess(
          response.data as Parameters<typeof updateProfileSuccess>[0],
        );

        setWizardStep("emailUpdateSuccess");
        trackStepChange("emailUpdateSuccess", "update_email");
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
        trackStepError(
          "email_update_failed: FAILED_TO_UPDATE_EMAIL",
          "update_email",
        );
      }
    } catch (error) {
      console.error("Error updating email address with OTP:", error);
      const apiError = error as CaughtError;
      const errorMsg = apiError?.data?.message || "FAILED_TO_UPDATE_EMAIL";
      setErrorCode(errorMsg);
      trackStepError(`email_update_failed: ${errorMsg}`, "update_email");
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
          trackStepChange("otpValidation", "phone_selection");
          setWizardStep("otpValidation");
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={handleBackToProfile}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor!}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackStepAttempt("phone_otp_request_initiated", "phone_otp");
          return requestOtpCode();
        }}
        validateOtpCode={() => {
          trackStepAttempt("phone_otp_validation_initiated", "phone_otp");
          return validateOtpCode(userOtpValue, (response) => {
            if ((response as { success?: boolean })?.success) {
              setWizardStep("enterEmail");
              trackStepChange("enterEmail", "phone_otp");
            } else {
              trackStepError("phone_otp_validation_failed", "phone_otp");
            }
          });
        }}
        onBack={() => {
          const prevStep =
            userPhoneFactors && userPhoneFactors.length === 1
              ? "passwordVerification"
              : "otpSelection";
          trackStepChange(prevStep, "back");
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
          trackStepAttempt("email_otp_validation_initiated", "email_otp");

          if (userOtpValue && userOtpValue.trim()) {
            setWizardStep("emailConfirmUpdate");
            trackStepChange("emailConfirmUpdate", "email_otp");
          } else {
            setErrorCode("OTP_REQUIRED");
            trackStepError(
              "email_otp_validation_failed: OTP_REQUIRED",
              "email_otp",
            );
          }
        }}
        onCancel={handleBackToProfile}
        formData={formData}
        setFormData={setFormData}
        errorMessage={errorMessage}
        userOtpValue={userOtpValue}
        handleChange={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackStepAttempt("email_otp_request_initiated", "email_otp");
          return requestOtpCode({
            otpType: FLOW_TYPES.email,
            destination: formData.emailAddress,
          });
        }}
        onBack={handleBackToEnterEmail}
      />
    ),
    emailConfirmUpdate: (
      <EmailConfirmUpdate
        onSubmit={handleEmailChangeWithOtp}
        onCancel={handleBackToProfile}
        formData={formData}
      />
    ),
    emailUpdateSuccess: (
      <EmailUpdateSuccess
        newEmailAddress={formData.emailAddress}
        onBackToProfile={handleBackToProfile}
        onSignOut={handleSignOut}
      />
    ),
  };

  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
