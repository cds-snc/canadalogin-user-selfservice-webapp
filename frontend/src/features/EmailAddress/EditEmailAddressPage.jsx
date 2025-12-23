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
import EditEmailEnterEmail from "./EditEmailEnterEmail";
import EmailOtpValidation from "./EmailOtpValidation";
import EmailUpdateSuccess from "./EmailUpdateSuccess";
import EmailConfirmUpdate from "./EmailConfirmUpdate";

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState("passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [formData, setFormData] = useState({
    emailAddress: "",
  });

  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};

  const navigate = useNavigate();

  const backToProfile = path(PAGES.ProfileHome, {
    language: language,
  });
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      setWizardStep("otpSelection");
    },
  );

  const handleFormChange = (ev) => {
    // Handle both regular events and GcdsInput events
    const name = ev.target?.name || ev.detail?.name;
    const value = ev.target?.value || ev.detail?.value;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode,
    setLocalLoading,
  } = useOtpOperations(id, userName, setErrorCode, backToProfile);

  // Get user profile dispatch method
  const { updateProfileSuccess } = userProfileDispatch(dispatch);

  const handleBackToProfile = async () => {
    navigate(backToProfile);
  };

  const handleBackToEnterEmail = async () => {
    setWizardStep("enterEmail");
  };

  const handleSignOut = async (e) => {
    e.preventDefault();
    setLocalLoading(true);

    try {
      const response = await authService.logout();

      // Check if response has redirect_url and redirect
      if (response && response.data && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
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

  const handleEnterEmailSubmit = async () => {
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

    // Clear any previous errors and proceed to OTP validation
    setErrorCode("");
    setWizardStep("emailOtpValidation");
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
        updateProfileSuccess(response.data);

        // Navigate to success step
        setWizardStep("emailUpdateSuccess");
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
      }
    } catch (error) {
      console.error("Error updating email address with OTP:", error);
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
      }
    }
  };

  const errorMessage = getErrorMessage(language, errorCode);

  const steps = {
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
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        userSelectedMfaFactor={userSelectedMfaFactor}
        onNext={() => {
          setWizardStep("otpValidation");
        }}
        parentPage={PAGES.addMFAPage}
        onCancel={handleBackToProfile}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
        userSelectedMfaFactor={userSelectedMfaFactor}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={requestOtpCode}
        validateOtpCode={() =>
          validateOtpCode(userOtpValue, (response) => {
            if (response.success) {
              setWizardStep("enterEmail");
            }
          })
        }
        onBack={() => setWizardStep("otpSelection")}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={handleBackToProfile}
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
        requestOtpCode={() =>
          requestOtpCode(FLOW_TYPES.email, formData.emailAddress)
        }
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
