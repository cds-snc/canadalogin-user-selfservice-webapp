import { useLocation, useNavigate, useParams } from "react-router";
import { useRef, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import { PAGES, serverMapping } from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import { getPageContent } from "../../../../utils/functions";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import DeleteFIDO2PasskeyConfirm from "./DeleteFIDO2PasskeyConfirm";
import VerifyFIDO2Passkey from "../VerifyFIDO2Passkey/VerifyFIDO2Passkey";
import { useUser } from "../../../../components/Providers/useUser";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../../../hooks/usePasskeyOperations";
import { authService } from "../../../../services/authService";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import DeleteFIDO2PasskeySuccess from "./DeleteFIDO2PasskeySuccess";
import { fido2Api } from "../../api/fido2Api";

export default function DeleteFIDO2PasskeyPage({ step }) {
  const { state } = useUser();
  const { userProfile } = state;
  const { language } = useParams();
  const location = useLocation();
  const {
    passkeyId: passkeyToDeleteId,
    passkeyNickname: passkeyToDeleteNickname,
  } = location.state || {};
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const errorMessage = getErrorMessage(language, errorCode);
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const [userPasswordValue, setUserPasswordValue] = useState("");

  const [selected2FAPasskey, setSelected2FAPasskey] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
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
    setOtpSentResponse,
  } = useOtpOperations({
    userId: userProfile.id,
    userName: userProfile.userName,
    setErrorCode,
    fallbackNavigationPath: backToManage2FAVerificationsPage,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    setErrorCode,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      if (
        userPhoneFactors &&
        userPhoneFactors.length === 1 &&
        (!fido2Data || fido2Data.length === 0)
      ) {
        setWizardStep("otpValidation");
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  const didFetch = useRef(false);

  const requestOtpCode = async () => {
    const userData = {
      user_id: userProfile.id,
      factor_id: userSelectedMfaFactor.id,
      otpType: serverMapping[userSelectedMfaFactor.type],
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
        // Navigate to delete confirmation step
        setWizardStep("deleteFIDO2PasskeyConfirmation");
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

  const handleDeleteFIDO2 = async () => {
    const passkeyId = passkeyToDeleteId;

    if (!passkeyId) {
      setErrorCode("error_delete_credential");
      return;
    }

    setErrorCode("");
    setDeleteLoading(true);

    try {
      const response = await fido2Api.deleteRegistration(passkeyId);

      if (response && response.success) {
        setWizardStep("deleteFIDO2PasskeySuccess");
      } else {
        throw new Error("error_delete_credential");
      }
    } catch (err) {
      console.error("error_delete_credential", err);
      setErrorCode("error_delete_credential");
    } finally {
      setDeleteLoading(false);
    }
  };

  const isLoading =
    localLoading || passkeyLoading || validatePasswordLoading || deleteLoading;

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
        onNext={() => {
          setWizardStep("otpValidation");
        }}
        onSelectFIDO2={(passkey) => {
          setSelected2FAPasskey(passkey);
          setWizardStep("verifyFIDO2Passkey");
        }}
        parentPage={PAGES.deleteFIDO2PasskeyPage}
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
        onCancel={() => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={userPhoneFactors && userPhoneFactors.length > 1}
      />
    ),
    verifyFIDO2Passkey: (
      <VerifyFIDO2Passkey
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        selectedPasskey={selected2FAPasskey}
        onCallback={() => {
          setWizardStep("deleteFIDO2PasskeyConfirmation");
        }}
        onTryAnotherWayHandler={() => {
          setSelected2FAPasskey(null);
          setWizardStep("otpSelection");
        }}
      />
    ),
    deleteFIDO2PasskeyConfirmation: (
      <DeleteFIDO2PasskeyConfirm
        passkeyNickname={passkeyToDeleteNickname}
        onConfirm={handleDeleteFIDO2}
        onCancel={() => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    deleteFIDO2PasskeySuccess: (
      <DeleteFIDO2PasskeySuccess
        onNext={() => navigate(backToManage2FAVerificationsPage)}
      />
    ),
  };
  return isLoading ? (
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
