import { useState } from "react";
import Loader from "../../components/Layout/Loading";
import StepContent from "../../components/Wizard/StepContent";
import { useNavigate, useParams } from "react-router";
import { path } from "../../utils/routeHelpers";
import { PAGES } from "../../utils/constants";
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

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState("enterEmail");
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [formData, setFormData] = useState({
    emailAddress: "",
  });

  const { language } = useParams();
  const { state, userDispatch } = useUser();
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
    localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
    validateOtpCode: baseValidateOtpCode,
  } = useOtpOperations(id, userName, setErrorCode, backToProfile);

  const handleBackToProfile = async () => {
    navigate(backToProfile);
  };

  const handleSignOut = async () => {
    try {
      await authService.logout();
      // Navigate to login or home page after logout
      navigate(`/${language}`);
    } catch (error) {
      console.error("Error during logout:", error);
      // Still navigate away even if logout fails
      navigate(`/${language}`);
    }
  };

  const handleEnterEmailSubmit = async (newEmailAddress) => {
    try {
      setErrorCode("");

      if (!newEmailAddress || !newEmailAddress.trim()) {
        setErrorCode("EMAIL_REQUIRED");
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newEmailAddress)) {
        setErrorCode("INVALID_EMAIL");
        return;
      }

      // Update the form data with the new email
      setFormData((prev) => ({
        ...prev,
        emailAddress: newEmailAddress,
      }));

      // Call the backend API to update email address
      const response = await authService.update_email_address(newEmailAddress);

      if (response && response.success && response.data) {
        // Update the user profile in context
        userProfileDispatch(userDispatch, response.data);

        // Navigate to success step
        setWizardStep("emailChangeCompleted");
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
      }
    } catch (error) {
      console.error("Error updating email address:", error);
      if (error && error.data && error.data.message) {
        setErrorCode(error.data.message);
      } else {
        setErrorCode("FAILED_TO_UPDATE_EMAIL");
      }
    }
  };

  // Custom validateOtpCode that handles email change logic
  const validateOtpCode = async (userOtpValue) => {
    await baseValidateOtpCode(userOtpValue, () => {
      setWizardStep("enterEmail");
    });
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
        validateOtpCode={validateOtpCode}
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
        onSubmit={handleEnterEmailSubmit}
        onCancel={handleBackToProfile}
        formData={formData}
        errorMessage={errorMessage}
        userOtpValue={userOtpValue}
        handleChange={handleSetUserOtpValue}
      />
    ),
    emailChangeCompleted: (
      <EmailUpdateSuccess
        newEmailAddress={formData.emailAddress}
        onBackToProfile={handleBackToProfile}
        onSignOut={handleSignOut}
      />
    ),
  };
  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson["12"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
