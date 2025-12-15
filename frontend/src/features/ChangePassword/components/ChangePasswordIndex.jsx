import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";

import Password from "./Password.jsx";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation.jsx";

import { PAGES } from "../../../utils/constants.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";
import { getErrorMessage } from "../../../utils/errorUtils.js";

import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import OtpSelection from "../../TransientOtp/components/OtpSelection.jsx";
import OtpVerification from "../../TransientOtp/components/OtpVerification.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification.jsx";
import StepContent from "../../../components/Wizard/StepContent.jsx";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../hooks/useOtpOperations";

const defaulPasswordUpdatetStep = "passwordVerification";

export default function ChangePasswordIndex() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { removeAuthenticatedPage } = userProfileDispatch(dispatch);
  const { pathname } = useLocation();
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [errorCode, setErrorCode] = useState("");

  const errorMessage = getErrorMessage(language, errorCode);

  const [userPasswordValue, setUserPasswordValue] = useState("");
  const pageContentJson = getPageContent(language, PAGES.otpSelection);

  const [passwordUpdateStep, setPasswordUpdateStep] = useState(
    defaulPasswordUpdatetStep,
  );
  const [localLoading, setLocalLoading] = useState(false);
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      setPasswordUpdateStep("otpSelection");
    },
  );

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
  } = useOtpOperations(id, userName, setErrorCode, backToSecuritySettingsPage);

  const handleLoading = (bool) => {
    setLocalLoading(bool);
  };

  // Custom requestOtpCode for password change flow using passwordUpdate API
  const requestOtpCode = async () => {
    try {
      const response = await passwordUpdate.firstStep(
        userName,
        userSelectedMfaFactor,
      );
      if (response && response.success) {
        setOtpSentResponse(response.data);
      }
      setErrorCode("");
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    }
  };

  // Custom validateOtpCode for password change flow using passwordUpdate API
  const validateOtpCode = async (userOtpValue) => {
    setLocalLoading(true);
    try {
      const response = await passwordUpdate.secondStep(
        userOtpValue,
        otpSentResponse.trxId,
      );
      if (response && response.success) {
        setPasswordUpdateStep("passwordChange");
      }
      setErrorCode("");
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      // when a user navigates away from this component, we remove the pathname from the array
      // In the Private Route handler, we track the page to avoid a redirect loop to reautenticate the user
      removeAuthenticatedPage(pathname);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => await navigate(backToSecuritySettingsPage)}
        validatePassword={validatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
      />
    ),
    otpSelection: (
      <OtpSelection
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        userSelectedMfaFactor={userSelectedMfaFactor}
        onNext={() => {
          setPasswordUpdateStep("otpValidation");
        }}
        onCancel={async () => await navigate(backToSecuritySettingsPage)}
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
        onBack={() => setPasswordUpdateStep("otpSelection")}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={async () => await navigate(backToSecuritySettingsPage)}
      />
    ),
    passwordChange: (
      <Password
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        userProfile={userProfile}
        userSelectedMfaType={userSelectedMfaFactor?.type}
        localLoading={localLoading}
        setLocalLoading={handleLoading}
        otpSentResponse={otpSentResponse}
        userOtpValue={userOtpValue}
        onNext={() => {
          setPasswordUpdateStep("passwordChangedConfirmation");
        }}
        onBack={() => setPasswordUpdateStep("otpValidation")}
      />
    ),
    passwordChangedConfirmation: <PasswordChangedConfirmation />,
  };

  return localLoading || validatePasswordLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[passwordUpdateStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
