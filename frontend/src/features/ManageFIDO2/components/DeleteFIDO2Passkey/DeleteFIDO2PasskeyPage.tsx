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
import {
  extractOtpServerMetadata,
  mergeOtpSentResponseWithMetadata,
} from "../../../../utils/otpMetadata";

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
  const [passkeyAssertionResult, setPasskeyAssertionResult] = useState<
    unknown | null
  >(null);
  const [deletionVerificationProofId, setDeletionVerificationProofId] =
    useState("");
  const [verificationMethod, setVerificationMethod] = useState<
    "otp" | "passkey" | null
  >(null);
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
    setOtpSentResponse,
  } = useOtpOperations({
    userId: userProfile!.id,
    userName: userProfile!.userName,
    setErrorCode,
    fallbackNavigationPath: backToManage2FAVerificationsPage,
    allowEmptyFactors: true,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    enabled: true,
    setErrorCode,
  });

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      const phoneFactorCount = userPhoneFactors?.length ?? 0;
      const passkeyCount = fido2Data?.length ?? 0;

      if (phoneFactorCount === 1 && passkeyCount === 0) {
        const success = await requestOtpCode();
        if (success) {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          setWizardStep("otpValidation");
        }
      } else if (phoneFactorCount === 0 && passkeyCount === 1) {
        setSelected2FAPasskey(fido2Data[0]);
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
        });
        setWizardStep("verifyFIDO2Passkey");
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

  const getDeleteErrorData = (error: unknown) => {
    const errData = error as {
      data?: {
        message?: string;
        retries?: number;
        attempts?: number;
        trxnId?: string;
        created?: string;
        expiry?: string;
      };
      response?: {
        data?: {
          message?: string;
          retries?: number;
          attempts?: number;
          trxnId?: string;
          created?: string;
          expiry?: string;
        };
      };
    };

    return errData.data ?? errData.response?.data;
  };

  const navigateBackToVerificationStep = () => {
    if (verificationMethod === "passkey") {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
      });
      setWizardStep("verifyFIDO2Passkey");
      return;
    }

    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
    });
    setWizardStep("otpValidation");
  };

  const verifyDeletionWithPasskey = async (
    verifiedAssertionResult?: unknown,
  ) => {
    const assertionPayload = verifiedAssertionResult ?? passkeyAssertionResult;

    if (!passkeyToDeleteId || assertionPayload == null) {
      const message = "error_delete_credential";
      setErrorCode(message);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
        error: message,
      });
      return;
    }

    try {
      setErrorCode("");
      setCustomErrorMessage("");
      setDeletionVerificationProofId("");

      const response = await fido2Api.verifyDeleteRegistration(
        passkeyToDeleteId,
        assertionPayload,
      );

      const verificationProofId = response?.data?.verificationProofId ?? "";
      if (!response?.success || !verificationProofId) {
        throw { data: { message: "invalidCode" } };
      }

      setPasskeyAssertionResult(assertionPayload);
      setVerificationMethod("passkey");
      setDeletionVerificationProofId(verificationProofId);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
      });
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
      });
      setWizardStep("deleteFIDO2PasskeyConfirmation");
    } catch (err) {
      const errorData = getDeleteErrorData(err);
      const message = errorData?.message ?? "error_fido2_verification";
      setErrorCode(message);
      setCustomErrorMessage("");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
        error: message,
      });
    }
  };

  const validateOtpCode = async (otpValue: string): Promise<void> => {
    const otpVerificationType =
      userSelectedMfaFactor != null
        ? serverMapping[
            userSelectedMfaFactor.type as keyof typeof serverMapping
          ]
        : undefined;

    const trxnId = otpSentResponse?.trxnId;

    if (!passkeyToDeleteId || !otpVerificationType || !trxnId) {
      setErrorCode("otp_expired");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
        error: "otp_expired",
      });
      throw { data: { message: "otp_expired" } };
    }

    setPasskeyAssertionResult(null);
    setErrorCode("");
    setCustomErrorMessage("");
    setDeletionVerificationProofId("");

    try {
      const response = await fido2Api.verifyDeleteRegistration(
        passkeyToDeleteId,
        undefined,
        {
          otp: otpValue,
          trxnId,
          otpVerificationType,
        },
      );

      const verificationProofId = response?.data?.verificationProofId ?? "";
      if (!response?.success || !verificationProofId) {
        throw { data: { message: "invalidCode" } };
      }

      setVerificationMethod("otp");
      setDeletionVerificationProofId(verificationProofId);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
      });
      setWizardStep("deleteFIDO2PasskeyConfirmation");
    } catch (err) {
      setOtpSentResponse((prev) =>
        mergeOtpSentResponseWithMetadata(prev, extractOtpServerMetadata(err)),
      );
      const errorData = getDeleteErrorData(err);
      const message = errorData?.message ?? "invalidCode";
      const attemptsMessage = getOtpAttemptsErrorMessage(errorData);

      setErrorCode(message);
      setCustomErrorMessage("");
      if (attemptsMessage) {
        setCustomErrorMessage(attemptsMessage);
      }

      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
        error: message,
      });

      throw err;
    }
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
      if (!deletionVerificationProofId) {
        setErrorCode("otp_expired");
        setCustomErrorMessage("");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
          error: "otp_expired",
        });
        navigateBackToVerificationStep();
        return;
      }

      const response = (await fido2Api.deleteRegistration(
        passkeyId,
        undefined,
        undefined,
        {
          action: "commit",
          verificationProofId: deletionVerificationProofId,
        },
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
        setDeletionVerificationProofId("");
        setVerificationMethod(null);
        setCustomErrorMessage("");
        setWizardStep("deleteFIDO2PasskeySuccess");
      } else {
        throw new Error("error_delete_credential");
      }
    } catch (err) {
      setOtpSentResponse((prev) =>
        mergeOtpSentResponseWithMetadata(prev, extractOtpServerMetadata(err)),
      );
      const errorData = getDeleteErrorData(err);
      const message = errorData?.message ?? "error_delete_credential";
      const attemptsMessage = getOtpAttemptsErrorMessage(errorData);
      setErrorCode(message);
      setCustomErrorMessage("");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_PASSKEY_ANALYTICS.STEPS.CONFIRM_DELETE,
        error: message,
      });
      if (
        message === "otp_expired" ||
        message === "invalidCode" ||
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          errorData?.message ?? "",
        )
      ) {
        if (attemptsMessage) {
          setCustomErrorMessage(attemptsMessage);
        }
        setDeletionVerificationProofId("");
        navigateBackToVerificationStep();
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
          setVerificationMethod(null);
          setDeletionVerificationProofId("");
          setErrorCode("");
          setCustomErrorMessage("");
          setPasskeyAssertionResult(null);
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
          setVerificationMethod(null);
          setDeletionVerificationProofId("");
          setErrorCode("");
          setCustomErrorMessage("");
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
        otpCreatedAt={otpSentResponse?.created}
        onCancel={() => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={userPhoneFactors && userPhoneFactors.length > 1}
      />
    ),
    verifyFIDO2Passkey: (
      <VerifyFIDO2Passkey
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        assertionOptionsRequest={{ userVerification: "required" }}
        setAssertionResult={setPasskeyAssertionResult}
        selectedPasskey={selected2FAPasskey}
        onCallback={(assertionResult) => {
          void verifyDeletionWithPasskey(assertionResult);
        }}
        onTryAnotherWayHandler={() => {
          setVerificationMethod(null);
          setDeletionVerificationProofId("");
          setPasskeyAssertionResult(null);
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
