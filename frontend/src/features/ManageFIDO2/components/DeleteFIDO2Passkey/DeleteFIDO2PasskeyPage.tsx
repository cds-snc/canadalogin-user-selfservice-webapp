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
import { useFormTracking } from "../../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../../hooks/useWizardPageTracking";
import {
  GA_FORM_EVENTS,
  DELETE_PASSKEY_ANALYTICS,
} from "../../../../utils/analyticsConstants";

interface DeleteFIDO2PasskeyPageProps {
  step?: string;
}

const DELETE_PASSKEY_PAGE_BY_STEP: Record<string, string> = {
  passwordVerification: "DeletePasskeyVerifyIdentity",
  otpSelection: "DeletePasskeyOtpSelection",
  otpValidation: "DeletePasskeyOtpValidation",
  verifyFIDO2Passkey: "DeletePasskeyVerifyPasskey",
  deleteFIDO2PasskeyConfirmation: "DeletePasskeyConfirm",
  deleteFIDO2PasskeySuccess: "DeletePasskeySuccess",
};

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
  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const errorMessage =
    customErrorMessage || getErrorMessage(language, errorCode);
  const { t } = useTranslation(["security", "common"]);
  const [userPasswordValue, setUserPasswordValue] = useState("");

  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: DELETE_PASSKEY_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(wizardStep, DELETE_PASSKEY_PAGE_BY_STEP);

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
    allowEmptyFactors: true,
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
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          setWizardStep("otpValidation");
        }
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_SELECTION,
        });
        setWizardStep("otpSelection");
      }
    },
    false,
    (message) => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_PASSWORD,
        error: message,
      });
    },
  );

  // Create tracked password validation wrapper
  async function handleValidatePassword(password: string) {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_PASSWORD,
      flow: DELETE_PASSKEY_ANALYTICS.FLOW_ID,
    });
    await validatePassword(password);
  }

  const getOtpAttemptsErrorMessage = (errorData?: {
    retries?: number;
    attempts?: number;
  }) => {
    const retries = errorData?.retries;
    const attempts = errorData?.attempts;

    if (
      retries === undefined ||
      retries === null ||
      attempts === undefined ||
      attempts === null
    ) {
      return "";
    }

    const remaining = retries - attempts;
    if (remaining <= 0) {
      return t("Error.otp_max_attempts", { ns: "common" });
    }

    return t("Error.otp_invalid_attempts", {
      ns: "common",
      count: remaining,
    });
  };

  const validateOtpCode = async (_otpValue: string): Promise<void> => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
    });
    setErrorCode("");
    setCustomErrorMessage("");
    setWizardStep("deleteFIDO2PasskeyConfirmation");
  };

  const handleDeleteFIDO2 = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
    });
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
      flow: DELETE_PASSKEY_ANALYTICS.FLOW_ID,
    });

    const passkeyId = passkeyToDeleteId;

    if (!passkeyId) {
      setErrorCode("error_delete_credential");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
        error: "error_delete_credential",
      });
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
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
        });
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_PASSKEY_ANALYTICS.STEPS.SUCCESS,
        });
        setCustomErrorMessage("");
        setWizardStep("deleteFIDO2PasskeySuccess");
      } else {
        throw new Error("error_delete_credential");
      }
    } catch (err) {
      const errData = err as {
        data?: { message?: string; retries?: number; attempts?: number };
      };
      const message = errData?.data?.message ?? "error_delete_credential";
      const attemptsMessage = getOtpAttemptsErrorMessage(errData?.data);
      setErrorCode(message);
      setCustomErrorMessage("");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
        error: message,
      });
      if (
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          errData?.data?.message ?? "",
        )
      ) {
        if (attemptsMessage) {
          setCustomErrorMessage(attemptsMessage);
        }
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
        validatePassword={handleValidatePassword}
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
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
              });
              setWizardStep("otpValidation");
            }
          })();
        }}
        onSelectFIDO2={(passkey) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
          });
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
        validateOtpCode={(otpValue) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          return validateOtpCode(otpValue);
        }}
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
        setErrorMessage={setCustomErrorMessage}
        errorMessage={errorMessage}
        otpExpiry={otpSentResponse?.expiry}
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
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
          });
          setWizardStep("deleteFIDO2PasskeyConfirmation");
        }}
        onTryAnotherWayHandler={() => {
          setSelected2FAPasskey(null);
          setWizardStep("otpSelection");
        }}
        onError={(errCode) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_END,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
            error: errCode,
          });
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
      errorMessage={errorMessage}
      language={language}
    />
  );
}
