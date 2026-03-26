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

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      if (userPhoneFactors && userPhoneFactors.length === 1) {
        const success = await requestOtpCode();
        if (success) setWizardStep("otpValidation");
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

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
      setLocalLoading(true);
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const handleEnterEmailSubmit = async (_emailAddress?: string) => {
    // Validate email address before proceeding to OTP validation
    if (!formData.emailAddress || !formData.emailAddress.trim()) {
      setErrorCode("EMAIL_REQUIRED");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.emailAddress)) {
      setErrorCode("INVALID_EMAIL");
      return;
    }

    // Send OTP to the new email address, then navigate to verification step
    setErrorCode("");
    const success = await requestOtpCode({
      otpType: FLOW_TYPES.email,
      destination: formData.emailAddress,
    });
    if (success) setWizardStep("emailOtpValidation");
  };

  const handleEmailChangeWithOtp = async () => {
    try {
      setErrorCode("");

      if (!formData.emailAddress || !formData.emailAddress.trim()) {
        setErrorCode("EMAIL_REQUIRED");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailAddress)) {
        setErrorCode("INVALID_EMAIL");
        return;
      }

      // Ensure we have OTP data from the previous validation
      if (!userOtpValue || !otpSentResponse?.trxnId) {
        setErrorCode("OTP_VERIFICATION_REQUIRED");
        return;
      }

      // Call the backend API to update email address
      const response = await authService.update_email_with_otp(
        formData.emailAddress,
        userOtpValue,
        otpSentResponse.trxnId,
        FLOW_TYPES.email,
      );

      if (response && response.success && response.data) {
        // Update the user profile in context
        updateProfileSuccess(
          response.data as Parameters<typeof updateProfileSuccess>[0],
        );

        // Navigate to success step
        setWizardStep("emailUpdateSuccess");
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
      }
    } catch (error) {
      console.error("Error updating email address with OTP:", error);
      const apiError = error as CaughtError;
      const message = apiError?.data?.message ?? "FAILED_TO_UPDATE_EMAIL";
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
        validatePassword={validatePassword}
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
            if (success) setWizardStep("otpValidation");
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
        requestOtpCode={requestOtpCode}
        validateOtpCode={() =>
          validateOtpCode(userOtpValue, (response) => {
            if ((response as { success?: boolean })?.success) {
              setWizardStep("enterEmail");
            }
          })
        }
        onBack={() => {
          // If there's only one MFA factor, go back to password verification
          // Otherwise, go back to OTP selection
          if (userPhoneFactors && userPhoneFactors.length === 1) {
            setWizardStep("passwordVerification");
          } else {
            setWizardStep("otpSelection");
          }
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
          // Skip separate OTP validation - go directly to confirmation
          // OTP will be validated atomically with the email update
          if (userOtpValue && userOtpValue.trim()) {
            setWizardStep("emailConfirmUpdate");
          } else {
            setErrorCode("OTP_REQUIRED");
          }
        }}
        onCancel={handleBackToProfile}
        formData={formData}
        setFormData={setFormData}
        errorMessage={errorMessage}
        userOtpValue={userOtpValue}
        handleChange={handleSetUserOtpValue}
        requestOtpCode={async () => {
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
