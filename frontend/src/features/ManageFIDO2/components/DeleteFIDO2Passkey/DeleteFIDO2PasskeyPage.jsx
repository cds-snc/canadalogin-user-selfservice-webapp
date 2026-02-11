import { useNavigate, useParams } from "react-router";
import { useEffect, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import { PAGES } from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import { getPageContent } from "../../../../utils/functions";
import { fetchUserFIDO2Credentials } from "../../utils/fetchUserFIDO2Credentials";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import DeleteFIDO2PasskeyConfirm from "./DeleteFIDO2PasskeyConfirm";
import SelectFIDO2Passkey from "../VerifyFIDO2Passkey/SelectFIDO2Passkey";

export default function DeleteFIDO2PasskeyPage({ step }) {
  const { language } = useParams();
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const errorMessage = getErrorMessage(language, errorCode);
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection);
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [fido2Data, setFido2Data] = useState([]);
  const [localLoading, setLocalLoading] = useState(true);
  const [assertionResult, setAssertionResult] = useState(null);
  console.log("errorCode", errorCode);
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      if (fido2Data && fido2Data.length > 0) {
        setWizardStep("selectFIDO2Passkey");
      } else {
        navigate(backToManage2FAVerificationsPage);
      }
    },
  );

  useEffect(() => {
    /**
     * Fetch user's FIDO2 credentials
     */
    fetchUserFIDO2Credentials({
      setLoading: setLocalLoading,
      setData: setFido2Data,
      setErrorCode: setErrorCode,
    });
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
    selectFIDO2Passkey: (
      <SelectFIDO2Passkey
        setAssertionResult={setAssertionResult}
        setErrorCode={setErrorCode}
        onCallback={() => {
          setWizardStep("deleteFIDO2PasskeyConfirmation");
        }}
      />
    ),
    deleteFIDO2PasskeyConfirmation: (
      <DeleteFIDO2PasskeyConfirm
        setErrorCode={setErrorCode}
        assertionResult={assertionResult}
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
