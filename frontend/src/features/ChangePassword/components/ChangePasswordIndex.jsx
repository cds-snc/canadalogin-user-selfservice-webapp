import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router";
import { useUser } from "../../../components/Providers/useUser.tsx";
import Loader from "../../../components/Layout/Loading.jsx";

import Password from "./Password.jsx";
import PasswordChangedConfirmation from "./PasswordChangedConfirmation.jsx";

import { otpFactors } from "../api/otpFactors.jsx";
import { PAGES } from "../../../utils/constants.jsx";
import { userProfileDispatch } from "../../../utils/userProfileDispatch.jsx";

import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import OtpSelection from "../../TransientOtp/components/OtpSelection.jsx";
import OtpVerification from "../../TransientOtp/components/OtpVerification.jsx";
import { passwordUpdate } from "../api/passwordUpdate.jsx";
import { authService } from "../../../services/authService.jsx";
import PasswordVerification from "../../TransientOtp/components/PasswordVerification.jsx";
import StepContent from "../../../components/Wizard/StepContent.jsx";

const defaulPasswordUpdatetStep = "passwordVerification";

export default function ChangePasswordIndex() {
  const { language } = useParams();
  const { state, dispatch } = useUser();
  const { removeAuthenticatedPage } = userProfileDispatch(dispatch);
  const { pathname } = useLocation();
  const [userSelectedMfaFactor, setUserSelectedMfaFactor] = useState(null);
  const [otpSentResponse, setOtpSentResponse] = useState(null);
  const [errorCode, setErrorCode] = useState("");
  const errorPageJson = getPageContent(language, PAGES.error);

  const errorMessage = errorCode
    ? errorPageJson[errorCode] || errorPageJson["7"]
    : "";

  const [userPhoneFactors, setUserPhoneFactors] = useState([]);

  const [userOtpValue, setUserOtpValue] = useState("");
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

  const handleChangeUserMfaSelection = (id) => {
    const selectedMfaFactor = userPhoneFactors.find(
      (factor) => factor.id === id,
    );

    if (selectedMfaFactor) {
      setUserSelectedMfaFactor(selectedMfaFactor);
    }
  };

  const handleLoading = (bool) => {
    setLocalLoading(bool);
  };

  const handleSetUserOtpValue = (userOtpValue) => {
    setUserOtpValue(userOtpValue);
  };

  const didFetch = useRef(false);

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
    } finally {
      didFetch.current = false;
    }
  };

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

  const validatePassword = async (userPasswordValue) => {
    setLocalLoading(true);
    try {
      const passwordPolicyResponse = await authService.requestPasswordPolicy();
      if (passwordPolicyResponse.success) {
        const passwordPolicy = {
          min: passwordPolicyResponse.data.pwdMinLength,
          max: passwordPolicyResponse.data.pwdMaxLength,
        };
        if (
          !userPasswordValue ||
          userPasswordValue.length < passwordPolicy.min ||
          userPasswordValue.length > passwordPolicy.max
        ) {
          setErrorCode("5");
          return;
        }
      }
      const response = await authService.verifyPassword({
        password: userPasswordValue,
      });
      if (response && response.success) {
        setPasswordUpdateStep("otpSelection");
        setErrorCode("");
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    const fetchUserOtpPhoneFactors = async () => {
      setLocalLoading(true);
      try {
        const response = await otpFactors.getUserOtpPhoneFactors(id);
        if (
          response &&
          response.success &&
          response.data.length > 0 &&
          response.data[0].type
        ) {
          setUserPhoneFactors(response.data);
          setUserSelectedMfaFactor(response.data[0]);
        } else {
          navigate(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("err", err);
      } finally {
        setLocalLoading(false);
      }
    };

    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return localLoading ? (
    <Loader text={pageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[passwordUpdateStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
