import { useNavigate, useParams } from "react-router";
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
import DeleteFIDO2PasskeyConfirmation from "./DeleteFIDO2PasskeyConfirmation";
import DeleteFIDO2PasskeySuccess from "./DeleteFIDO2PasskeySuccess";

export default function DeleteFIDO2PasskeyPage({ step }) {
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
          `/${language}/security-settings/delete-fido2/fido2-verification`,
          {
            replace: true,
          },
        );
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
        setWizardStep("deleteFido2Passkey");
        // Navigate to confirmation URL while preserving state
        navigate(
          `/${language}/security-settings/delete-fido2/delete-fido2-passkey`,
          {
            replace: true,
          },
        );
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
        if (response && response?.data?.authenticated) {
          setFido2Data(response?.data?.credentials || []);
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
        parentPage={PAGES.deleteFido2Passkey}
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
        parentPage={PAGES.deleteFido2Passkey}
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
    deleteFIDO2PasskeyConfirmation: <DeleteFIDO2PasskeyConfirmation />,
    deleteFIDO2PasskeySuccess: <DeleteFIDO2PasskeySuccess />,
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
