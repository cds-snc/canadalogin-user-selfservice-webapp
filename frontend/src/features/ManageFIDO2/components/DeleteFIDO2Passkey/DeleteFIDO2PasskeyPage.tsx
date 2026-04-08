import { useLocation, useNavigate, useParams } from "react-router";
import { useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import {
  PAGES,
  serverMapping,
  INVALID_OTP_ERROR_CODES,
} from "../../../../utils/constants";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import { useTranslation } from "react-i18next";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import DeleteFIDO2PasskeyConfirm from "./DeleteFIDO2PasskeyConfirm";
import VerifyFIDO2Passkey from "../VerifyFIDO2Passkey/VerifyFIDO2Passkey";
import { useUser } from "../../../../components/Providers/useUser";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../../../hooks/usePasskeyOperations";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import DeleteFIDO2PasskeySuccess from "./DeleteFIDO2PasskeySuccess";
import { fido2Api } from "../../api/fido2Api";
import type { Fido2Credential } from "../../../../types/hooks";

interface DeleteFIDO2PasskeyPageProps {
  step?: string;
}

export default function DeleteFIDO2PasskeyPage({
  step,
}: DeleteFIDO2PasskeyPageProps) {
  const { state } = useUser();
  const { userProfile } = state;
  const { language } = useParams();
  const location = useLocation();
  const {
    passkeyId: passkeyToDeleteId,
    passkeyNickname: passkeyToDeleteNickname,
  } = (location.state || {}) as {
    passkeyId?: string;
    passkeyNickname?: string;
  };
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const errorMessage = getErrorMessage(language, errorCode);
  const { t } = useTranslation("security");
  const [userPasswordValue, setUserPasswordValue] = useState("");

  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
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
    otpLoading: localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    requestOtpCode,
  } = useOtpOperations({
    userId: userProfile!.id,
    userName: userProfile!.userName,
    setErrorCode,
    fallbackNavigationPath: backToManage2FAVerificationsPage,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    setErrorCode,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      if (
        userPhoneFactors &&
        userPhoneFactors.length === 1 &&
        (!fido2Data || fido2Data.length === 0)
      ) {
        const success = await requestOtpCode();
        if (success) {
          setWizardStep("otpValidation");
        }
      } else {
        setWizardStep("otpSelection");
      }
    },
  );

  const validateOtpCode = async (_otpValue: string): Promise<void> => {
    setWizardStep("deleteFIDO2PasskeyConfirmation");
    setErrorCode("");
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
      const otpPayload =
        otpSentResponse?.trxnId && userOtpValue && userSelectedMfaFactor
          ? {
              otp: userOtpValue,
              trxnId: otpSentResponse.trxnId,
              otpVerificationType:
                serverMapping[
                  userSelectedMfaFactor.type as keyof typeof serverMapping
                ],
            }
          : undefined;

      const response = (await fido2Api.deleteRegistration(
        passkeyId,
        undefined,
        otpPayload,
      )) as { success?: boolean } | undefined;

      if (response && response.success) {
        setWizardStep("deleteFIDO2PasskeySuccess");
      } else {
        throw new Error("error_delete_credential");
      }
    } catch (err) {
      const errData = err as { data?: { message?: string } };
      const message = errData?.data?.message ?? "error_delete_credential";
      setErrorCode(message);
      if (
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          errData?.data?.message ?? "",
        )
      ) {
        setWizardStep("otpValidation");
      }
    } finally {
      setDeleteLoading(false);
    }
  };

  const isLoading =
    localLoading || passkeyLoading || validatePasswordLoading || deleteLoading;
  const steps: Record<string, React.ReactNode> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={validatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.deleteFIDO2PasskeyPage}
      />
    ),
    otpSelection: (
      <OtpSelection
        fido2Data={fido2Data}
        userPhoneFactors={userPhoneFactors}
        onChangeUserSelectedMfaFactor={handleChangeUserMfaSelection}
        onNext={() => {
          void (async () => {
            const success = await requestOtpCode();
            if (success) {
              setWizardStep("otpValidation");
            }
          })();
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
        userSelectedMfaFactor={userSelectedMfaFactor!}
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
    <Loader text={t("OtpSelection.loading")} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
