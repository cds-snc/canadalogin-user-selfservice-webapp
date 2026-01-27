import { useLocation, useNavigate, useParams } from "react-router";
import { useUser } from "../../../../components/Providers/useUser";
import { useEffect, useRef, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import { PAGES, serverMapping } from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { otpFactors } from "../../../TransientOtp/api/otpFactors";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import { authService } from "../../../../services/authService";
import { getPageContent } from "../../../../utils/functions";
import { fido2Api } from "../../api/fido2Api";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import AddFIDO2Passkey from "./AddFIDO2Passkey";

export default function AddFIDO2PasskeyPage() {
  // Map URL step parameter to internal wizard steps
  const getWizardStepFromUrl = (urlStep) => {
    switch (urlStep) {
      case "password-verification":
        return "passwordVerification";
      case "otp-selection":
        return "otpSelection";
      case "otp-validation":
        return "otpValidation";
      case "add-fido2-passkey":
        return "addFido2Passkey";
      default:
        return "passwordVerification";
    }
  };

  const { language, step } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [wizardStep, setWizardStep] = useState(getWizardStepFromUrl(step));
  const [errorCode, setErrorCode] = useState("");
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const errorMessage = getErrorMessage(language, errorCode);
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [fido2Data, setFido2Data] = useState([]);

  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    setUserPhoneFactors,
    setUserSelectedMfaFactor,
    setLocalLoading,
    setOtpSentResponse,
  } = useOtpOperations(id, userName, setErrorCode, backToSecuritySettingsPage);

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      if (fido2Data && fido2Data.length > 0) {
        // Handle case when FIDO2 data exists
        // Go to access policy OOTB step up
        navigate(
          `/${language}/security-settings/add-fido2/fido2-verification`,
          {
            replace: true,
          },
        );
      } else {
        // Handle case when no FIDO2 data exists
        // If there's only one MFA factor, skip OTP selection and go directly to validation
        if (userPhoneFactors && userPhoneFactors.length === 1) {
          setWizardStep("otpValidation");
          // Navigate to confirmation URL while preserving state
          navigate(`/${language}/security-settings/add-fido2/otp-validation`, {
            replace: true,
          });
        } else {
          setWizardStep("otpSelection");
          // Navigate to confirmation URL while preserving state
          navigate(`/${language}/security-settings/add-fido2/otp-selection`, {
            replace: true,
          });
        }
      }
    },
  );

  const didFetch = useRef(false);

  const requestOtpCode = async () => {
    const userData = {
      user_id: userProfile.id,
      otpType: serverMapping[userSelectedMfaFactor.type],
      phoneNumber: userSelectedMfaFactor.phoneNumber,
    };
    try {
      const response = await authService.transientOtpSend(userData);
      if (response && response.success) {
        setOtpSentResponse(response.data);
        setErrorCode("");
      }
    } catch (err) {
      if (err && err.data && err.data.message) {
        setErrorCode(err.data.message);
      }
    } finally {
      didFetch.current = false;
    }
  };

  const validateOtpCode = async (userOtpValue) => {
    const userData = {
      otp: userOtpValue,
      trxnId: otpSentResponse.trxnId,
      otpType: serverMapping[userSelectedMfaFactor.type],
    };
    try {
      const response = await authService.transientOtpVerify(userData);
      if (response && response.success) {
        setWizardStep("addFido2Passkey");
        // Navigate to confirmation URL while preserving state
        navigate(`/${language}/security-settings/add-fido2/add-fido2-passkey`, {
          replace: true,
        });
        setErrorCode("");
      }
    } catch (err) {
      if (
        err &&
        err.response &&
        err.response.data &&
        err.response.data.message
      ) {
        setErrorCode(err.response.data.message);
      }
    }
  };

  // Sync wizard step with URL parameter changes
  useEffect(() => {
    const newWizardStep = getWizardStepFromUrl(step);
    if (newWizardStep !== wizardStep) {
      setWizardStep(newWizardStep);
    }
  }, [step, wizardStep]);

  // Check if we're coming from a redirect with state data
  useEffect(() => {
    if (location?.state?.step) {
      // If we have state with a specific step, navigate to that step
      setWizardStep(location?.state?.step);
    }
  }, [location.state]);

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
          const userPhoneFactors = response.data;
          setUserPhoneFactors(userPhoneFactors);
          setUserSelectedMfaFactor(userPhoneFactors[0]);
        } else {
          navigate(backToSecuritySettingsPage);
        }
      } catch (err) {
        console.error("Error fetching user OTP phone factors:", err);
      } finally {
        setLocalLoading(false);
      }
    };
    /**
     * Fetch user's FIDO2 credentials
     */
    const fetchUserFIDO2Credentials = async () => {
      setLocalLoading(true);
      setErrorCode("");

      try {
        const response = await fido2Api.getUserFIDO2Credentials();

        if (response && response.authenticated) {
          setFido2Data(response.credentials);
        }
      } catch (error) {
        if (error && error.data && error.data.message) {
          setErrorCode(error.data.message);
        }
      } finally {
        setLocalLoading(false);
      }
    };
    fetchUserFIDO2Credentials();
    fetchUserOtpPhoneFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={validatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addFido2Passkey}
      />
    ),
    otpSelection: (
      <OtpSelection
        fido2Data={fido2Data}
        userProfile={userProfile}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        userSelectedMfaFactor={userSelectedMfaFactor}
        onNext={() => {
          setWizardStep("otpValidation");
          navigate(`/${language}/security-settings/add-fido2/otp-validation`, {
            replace: true,
          });
        }}
        parentPage={PAGES.addFido2Passkey}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
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
        onBack={() => {
          // If there's only one MFA factor, go back to password verification
          // Otherwise, go back to OTP selection
          if (userPhoneFactors && userPhoneFactors.length === 1) {
            setWizardStep("passwordVerification");
            navigate(
              `/${language}/security-settings/add-fido2/password-verification`,
              {
                replace: true,
              },
            );
          } else {
            setWizardStep("otpSelection");
            navigate(`/${language}/security-settings/add-fido2/otp-selection`, {
              replace: true,
            });
          }
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={userPhoneFactors && userPhoneFactors.length > 1}
      />
    ),
    addFido2Passkey: (
      <AddFIDO2Passkey
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
  };
  return localLoading || validatePasswordLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
