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

export default function EditEmailAddressPage() {
  const [wizardStep, setWizardStep] = useState("passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const [userPasswordValue, setUserPasswordValue] = useState("");

  const { language } = useParams();
  const { state } = useUser();
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};

  const navigate = useNavigate();

  const backToProfile = path(PAGES.ProfileHome, {
    language: language,
  });
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  // Use the password validation hook
  const { validatePassword } = usePasswordValidation(setErrorCode, () => {
    setWizardStep("otpSelection");
  });

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

  // Custom validateOtpCode that handles email change logic
  const validateOtpCode = async (userOtpValue) => {
    await baseValidateOtpCode(userOtpValue, () => {
      // TODO: Implement email address change logic here
      setWizardStep("emailChangeCompleted"); // This step would need to be implemented
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
  };
  return localLoading ? (
    <Loader text={pageContentJson["12"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
