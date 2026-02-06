import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../../components/Providers/useUser";
import { useCallback, useEffect, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import { PAGES } from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { otpFactors } from "../../../TransientOtp/api/otpFactors";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import { getPageContent } from "../../../../utils/functions";
import { fido2Api } from "../../api/fido2Api";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import DeleteFIDO2PasskeyConfirm from "./DeleteFIDO2PasskeyConfirm";

export default function DeleteFIDO2PasskeyPage({ step }) {
  const { language, passkeyId } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const [wizardStep, _setWizardStep] = useState(step ?? "passwordVerification");
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

  // Memoize setErrorCode to prevent infinite loops in child components
  const stableSetErrorCode = useCallback((error) => {
    setErrorCode(error);
  }, []);

  // Use the OTP operations hook
  const {
    localLoading,
    setUserPhoneFactors,
    setUserSelectedMfaFactor,
    setLocalLoading,
  } = useOtpOperations(
    id,
    userName,
    stableSetErrorCode,
    backToSecuritySettingsPage,
  );

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    () => {
      if (fido2Data && fido2Data.length > 0) {
        // Handle case when FIDO2 data exists
        // Go to access policy OOTB step up
        navigate(
          `/${language}/security-settings/manage-2fa-verifications/delete-fido2/${passkeyId}/fido2-verification`,
          {
            replace: true,
          },
        );
      } else {
        navigate(backToManage2FAVerificationsPage);
      }
    },
  );

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
        if (response && response?.success) {
          setFido2Data(response?.data?.fido2 || []);
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
    deleteFIDO2PasskeyConfirmation: (
      <DeleteFIDO2PasskeyConfirm setErrorCode={stableSetErrorCode} />
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
