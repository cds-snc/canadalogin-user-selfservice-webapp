import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../../components/Providers/useUser";
import { useEffect, useRef, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import {
  INVALID_OTP_ERROR_CODES,
  PAGES,
  serverMapping,
} from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import { authService } from "../../../../services/authService";
import { getPageContent } from "../../../../utils/functions";
import { fetchUserFIDO2Credentials } from "../../utils/fetchUserFIDO2Credentials";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import AddFIDO2Passkey from "./AddFIDO2Passkey";
import SelectFIDO2Passkey from "../VerifyFIDO2Passkey/SelectFIDO2Passkey";

type AddFIDO2PasskeyPageProps = {
  step?: string;
};

export default function AddFIDO2PasskeyPage({
  step,
}: AddFIDO2PasskeyPageProps) {
  const { language } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
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
    setLocalLoading,
    setOtpSentResponse,
  } = useOtpOperations(id, userName, setErrorCode, backToSecuritySettingsPage);

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      if (fido2Data && fido2Data.length > 0) {
        setWizardStep("selectFIDO2Passkey");
      } else {
        // Handle case when no FIDO2 data exists
        // If there's only one MFA factor, skip OTP selection and go directly to validation
        if (userPhoneFactors && userPhoneFactors.length === 1) {
          setWizardStep("otpValidation");
        } else {
          setWizardStep("otpSelection");
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
        // Navigate to confirmation URL while preserving state
        setWizardStep("addFIDO2Passkey");
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

  useEffect(() => {
    /**
     * Fetch user's FIDO2 credentials
     */
    fetchUserFIDO2Credentials({
      setLoading: setLocalLoading,
      setData: setFido2Data,
      setErrorCode,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (INVALID_OTP_ERROR_CODES.includes(errorCode)) {
      // If OTP is invalid, go back to OTP selection step
      setWizardStep("otpValidation");
    }
  }, [errorCode]);

  const steps = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={validatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addFIDO2Passkey}
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
        }}
        parentPage={PAGES.addFIDO2Passkey}
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
          } else {
            setWizardStep("otpSelection");
          }
        }}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={userPhoneFactors && userPhoneFactors.length > 1}
      />
    ),
    selectFIDO2Passkey: (
      <SelectFIDO2Passkey
        submitAttestationResult={true}
        setErrorCode={setErrorCode}
        onCallback={() => {
          setWizardStep("addFIDO2Passkey");
        }}
      />
    ),
    addFIDO2Passkey: (
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
