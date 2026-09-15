import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import Loader from "../../../../components/Layout/Loading";
import { useUser } from "../../../../components/Providers/useUser";
import {
  INVALID_OTP_ERROR_CODES,
  PAGES,
  serverMapping,
} from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { getErrorMessage } from "../../../../utils/errorUtils";
import { path } from "../../../../utils/routeHelpers";
import OtpSelection from "../../../TransientOtp/components/OtpSelection";
import OtpVerification from "../../../TransientOtp/components/OtpVerification";
import { deleteMFAPhoneNumberApi } from "../api/DeleteMFAPhoneNumberAPI";
import DeleteMFAPhoneNumberConfirm from "./DeleteMFAPhoneNumberConfirm";
import PasswordVerification from "../../../TransientOtp/components/PasswordVerification";
import StepContent from "../../../../components/Wizard/StepContent";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../../../hooks/usePasskeyOperations";
import { Fido2Credential, OtpFactor } from "../../../../types/hooks";
import { useFormTracking } from "../../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../../hooks/useWizardPageTracking";
import { GA_FORM_EVENTS } from "../../../../utils/analyticsConstants";
import { DELETE_MFA_ANALYTICS } from "../../../../utils/analyticsConstants";
import VerifyFIDO2Passkey from "../../../ManageFIDO2/components/VerifyFIDO2Passkey/VerifyFIDO2Passkey";
import {
  extractOtpServerMetadata,
  mergeOtpSentResponseWithMetadata,
} from "../../../../utils/otpMetadata";

interface DeletePhoneFormData {
  phoneNumber: string;
  otp: string;
  formattedPhoneNumber: string;
  mfaFactorsToDelete: OtpFactor[];
}

type WizardStep =
  | "passwordVerification"
  | "otpSelection"
  | "otpValidation"
  | "verifyFIDO2Passkey"
  | "deleteMFAPhoneNumberConfirm";

const DELETE_MFA_PAGE_BY_STEP: Record<WizardStep, string> = {
  passwordVerification: "DeletePhoneNumberVerifyIdentity",
  otpSelection: "DeletePhoneNumberOtpSelection",
  otpValidation: "DeletePhoneNumberOtpValidation",
  verifyFIDO2Passkey: "DeletePhoneNumberPasskeyVerification",
  deleteMFAPhoneNumberConfirm: "DeletePhoneNumberConfirm",
};

export default function DeleteMFAPage() {
  const { language } = useParams();
  const location = useLocation();
  const [savedLocationState, setSavedLocationState] = useState<{
    factorIds?: string[];
  } | null>(null);
  const { factorIds } = savedLocationState || {};

  const { state } = useUser();
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const { t } = useTranslation(["security", "common"]);

  const [errorCode, setErrorCode] = useState("");
  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const errorMessage =
    customErrorMessage || getErrorMessage(language, errorCode);
  const [wizardStep, setWizardStep] = useState<WizardStep>(
    "passwordVerification",
  );
  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
  const [assertionResult, setAssertionResult] = useState<unknown>(null);
  const [deletionVerificationProofId, setDeletionVerificationProofId] =
    useState("");
  const [verificationMethod, setVerificationMethod] = useState<
    "otp" | "passkey" | null
  >(null);
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const navigate = useNavigate();
  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: DELETE_MFA_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(wizardStep, DELETE_MFA_PAGE_BY_STEP);

  // Use the password validation hook
  const { validatePassword, validatePasswordLoading } = usePasswordValidation(
    setErrorCode,
    async () => {
      const phoneFactorCount = userPhoneFactors?.length ?? 0;
      const passkeyCount = fido2Data.length;

      if (phoneFactorCount === 1 && passkeyCount === 0) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
        });
        const success = await requestOtpCode();
        if (success) {
          setWizardStep("otpValidation");
        }
      } else if (phoneFactorCount === 0 && passkeyCount === 1) {
        setSelected2FAPasskey(fido2Data[0]);
        setWizardStep("verifyFIDO2Passkey");
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_MFA_ANALYTICS.STEPS.OTP_SELECTION,
        });
        setWizardStep("otpSelection");
      }
    },
    false,
    (message) => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_MFA_ANALYTICS.STEPS.VERIFY_PASSWORD,
        error: message,
      });
    },
  );

  // Create tracked password validation wrapper
  const handleValidatePassword = async (password: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: DELETE_MFA_ANALYTICS.STEPS.VERIFY_PASSWORD,
      flow: DELETE_MFA_ANALYTICS.FLOW_ID,
    });
    await validatePassword(password);
  };

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
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    enabled: true,
    setErrorCode,
  });

  const [phoneFormData, setPhoneFormData] = useState<DeletePhoneFormData>({
    phoneNumber: "",
    otp: "",
    formattedPhoneNumber: "",
    mfaFactorsToDelete: [],
  });

  const handlePhoneForm = (field: string, value: unknown) => {
    setPhoneFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const getDeleteMfaErrorData = (error: unknown) => {
    const typedError = error as {
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

    return typedError.data ?? typedError.response?.data;
  };

  const getDeleteFactorsPayload = () =>
    phoneFormData.mfaFactorsToDelete.map((factor) => ({
      id: factor.id,
      otpType: serverMapping[factor.type as keyof typeof serverMapping],
    }));

  const getSingleDeleteFactorPayload = () => {
    const [firstFactor] = phoneFormData.mfaFactorsToDelete;
    if (!firstFactor) {
      return null;
    }

    return {
      id: firstFactor.id,
      otpType: serverMapping[firstFactor.type as keyof typeof serverMapping],
    };
  };

  const getVerificationOtpType = () => {
    if (userSelectedMfaFactor) {
      return serverMapping[
        userSelectedMfaFactor.type as keyof typeof serverMapping
      ];
    }

    return getSingleDeleteFactorPayload()?.otpType;
  };

  const navigateBackToVerificationStep = (method: "otp" | "passkey" | null) => {
    if (method === "passkey") {
      setWizardStep("verifyFIDO2Passkey");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_MFA_ANALYTICS.STEPS.OTP_SELECTION,
      });
      return;
    }

    setWizardStep("otpValidation");
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
    });
  };

  const verifyDeletionWithPasskey = async (verifiedAssertion?: unknown) => {
    const assertionToVerify = verifiedAssertion ?? assertionResult;
    const singleFactor = getSingleDeleteFactorPayload();

    if (!assertionToVerify || !singleFactor) {
      setErrorCode("error_fido2_verification");
      return;
    }

    try {
      setErrorCode("");
      setCustomErrorMessage("");
      setDeletionVerificationProofId("");

      const response =
        phoneFormData.mfaFactorsToDelete.length > 1
          ? await deleteMFAPhoneNumberApi.verifyDeleteMFABatch({
              factors: getDeleteFactorsPayload(),
              assertionResult: assertionToVerify,
            })
          : await deleteMFAPhoneNumberApi.verifyDeleteMFA({
              id: singleFactor.id,
              otpType: singleFactor.otpType,
              assertionResult: assertionToVerify,
            });

      const verificationProofId = response?.data?.verificationProofId ?? "";
      if (!response?.success || !verificationProofId) {
        setErrorCode("invalidCode");
        return;
      }

      setAssertionResult(assertionToVerify);
      setVerificationMethod("passkey");
      setDeletionVerificationProofId(verificationProofId);
      setWizardStep("deleteMFAPhoneNumberConfirm");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
        flow: DELETE_MFA_ANALYTICS.FLOW_ID,
      });
    } catch (error) {
      const errorData = getDeleteMfaErrorData(error);
      const message = errorData?.message ?? "error_fido2_verification";
      setErrorCode(message);
      setCustomErrorMessage("");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_MFA_ANALYTICS.STEPS.OTP_SELECTION,
        error: message,
      });
    }
  };

  const deleteMFA = async () => {
    try {
      const singleFactor = getSingleDeleteFactorPayload();
      if (!singleFactor) {
        setErrorCode("invalidCode");
        return;
      }

      if (!deletionVerificationProofId) {
        setErrorCode("otp_expired");
        setCustomErrorMessage("");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
          error: "otp_expired",
        });
        navigateBackToVerificationStep(verificationMethod);
        return;
      }

      if (phoneFormData.mfaFactorsToDelete.length > 1) {
        await deleteMFAPhoneNumberApi.deleteMFABatch({
          action: "commit",
          factors: getDeleteFactorsPayload(),
          verificationProofId: deletionVerificationProofId,
        });
      } else {
        await deleteMFAPhoneNumberApi.deleteMFA({
          action: "commit",
          id: singleFactor.id,
          otpType: singleFactor.otpType,
          verificationProofId: deletionVerificationProofId,
        });
      }

      trackEvent({
        event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
        step: DELETE_MFA_ANALYTICS.STEPS.SUCCESS,
      });
      setDeletionVerificationProofId("");
      setVerificationMethod(null);
      setErrorCode("");
      setCustomErrorMessage("");
      navigate(backToManage2FAVerificationsPage, {
        state: {
          noticeType: "mfaDeleted",
          phoneNumber: phoneFormData.formattedPhoneNumber,
        },
      });
    } catch (error) {
      setOtpSentResponse((prev) =>
        mergeOtpSentResponseWithMetadata(prev, extractOtpServerMetadata(error)),
      );
      const errorData = getDeleteMfaErrorData(error);
      const message = errorData?.message ?? "";
      const attemptsMessage = getOtpAttemptsErrorMessage(errorData);
      setErrorCode(message);
      setCustomErrorMessage("");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
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
        navigateBackToVerificationStep(verificationMethod);
      }
    }
  };

  // Custom validateOtpCode that verifies OTP before moving to confirm.
  const validateOtpCode = async (otpValue: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
      flow: DELETE_MFA_ANALYTICS.FLOW_ID,
      type: userSelectedMfaFactor?.type,
    });

    const singleFactor = getSingleDeleteFactorPayload();
    const verificationOtpType = getVerificationOtpType();
    const trxnId = otpSentResponse?.trxnId;

    try {
      if (!singleFactor || !verificationOtpType || !trxnId) {
        throw { data: { message: "otp_expired" } };
      }

      setErrorCode("");
      setCustomErrorMessage("");
      setDeletionVerificationProofId("");

      const response =
        phoneFormData.mfaFactorsToDelete.length > 1
          ? await deleteMFAPhoneNumberApi.verifyDeleteMFABatch({
              factors: getDeleteFactorsPayload(),
              otp: otpValue,
              trxnId,
              otpVerificationType: verificationOtpType,
            })
          : await deleteMFAPhoneNumberApi.verifyDeleteMFA({
              id: singleFactor.id,
              otpType: singleFactor.otpType,
              otp: otpValue,
              trxnId,
              otpVerificationType: verificationOtpType,
            });

      const verificationProofId = response?.data?.verificationProofId ?? "";
      if (!response?.success || !verificationProofId) {
        throw { data: { message: "invalidCode" } };
      }

      setVerificationMethod("otp");
      setDeletionVerificationProofId(verificationProofId);
      setWizardStep("deleteMFAPhoneNumberConfirm");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
        flow: DELETE_MFA_ANALYTICS.FLOW_ID,
        type: userSelectedMfaFactor?.type,
      });
    } catch (error) {
      setOtpSentResponse((prev) =>
        mergeOtpSentResponseWithMetadata(prev, extractOtpServerMetadata(error)),
      );
      const errorData = getDeleteMfaErrorData(error);
      const message = errorData?.message ?? "invalidCode";
      setErrorCode(message);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
        error: message,
      });
      throw error;
    }
  };

  useEffect(() => {
    const locationState = location?.state as { factorIds?: string[] } | null;
    if (locationState?.factorIds && locationState.factorIds.length > 0) {
      // save location state to local state, when the language is toggled the location.state is null
      setSavedLocationState(locationState);
    } else {
      // redirect to edit page if no factor data exists
      navigate(backToManage2FAVerificationsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Check if factorIds exist in savedLocationState and userPhoneFactors are available
    if (!savedLocationState?.factorIds || !userPhoneFactors.length) {
      return;
    }

    // If factor data is provided via location state, pre-select the factors
    if (factorIds && factorIds.length > 0) {
      const mfaFactorsToDelete = userPhoneFactors.filter((factor) =>
        factorIds.includes(factor.id),
      );
      if (mfaFactorsToDelete.length > 0) {
        // Use the first matching factor for display, but collect all types for deletion
        const firstFactor = mfaFactorsToDelete[0];

        // Set the data in phoneFormData for deletion
        handlePhoneForm("mfaFactorsToDelete", mfaFactorsToDelete);
        handlePhoneForm("phoneNumber", firstFactor.destination);
        handlePhoneForm("formattedPhoneNumber", `${firstFactor.destination}`);
      } else {
        // Factor not found, go back to manage page
        navigate(backToManage2FAVerificationsPage);
      }
    } else {
      // No specific factor selected, go back to manage page (shouldn't happen in normal flow)
      navigate(backToManage2FAVerificationsPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factorIds, userPhoneFactors]);

  const steps: Record<WizardStep, React.ReactElement> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.deleteMFAPage}
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
              trackEvent({
                event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
                step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
              });
            }
          })();
        }}
        onSelectFIDO2={(passkey) => {
          setDeletionVerificationProofId("");
          setVerificationMethod(null);
          setErrorCode("");
          setCustomErrorMessage("");
          setSelected2FAPasskey(passkey);
          setAssertionResult(null);
          setWizardStep("verifyFIDO2Passkey");
        }}
        parentPage={PAGES.deleteMFAPage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    otpValidation: (
      <OtpVerification
        userSelectedMfaFactor={userSelectedMfaFactor!}
        userOtpValue={userOtpValue}
        setUserOtpValue={handleSetUserOtpValue}
        requestOtpCode={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: DELETE_MFA_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
          });
          return requestOtpCode();
        }}
        validateOtpCode={validateOtpCode}
        onBack={() => {
          const prevStep =
            userPhoneFactors &&
            userPhoneFactors.length === 1 &&
            fido2Data.length === 0
              ? "passwordVerification"
              : "otpSelection";
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: DELETE_MFA_ANALYTICS.STEPS.OTP_SELECTION,
          });
          setWizardStep(prevStep);
        }}
        setErrorCode={setErrorCode}
        setErrorMessage={setCustomErrorMessage}
        errorMessage={errorMessage}
        otpExpiry={otpSentResponse?.expiry}
        otpCreatedAt={otpSentResponse?.created}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        showTryAnotherWay={
          (userPhoneFactors && userPhoneFactors.length > 1) ||
          fido2Data.length > 0
        }
      />
    ),
    deleteMFAPhoneNumberConfirm: (
      <DeleteMFAPhoneNumberConfirm
        onNext={async () => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT,
            step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
            flow: DELETE_MFA_ANALYTICS.FLOW_ID,
          });
          await deleteMFA();
        }}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        phoneFormData={phoneFormData}
      />
    ),
    verifyFIDO2Passkey: (
      <VerifyFIDO2Passkey
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        assertionOptionsRequest={{ userVerification: "required" }}
        setAssertionResult={setAssertionResult}
        selectedPasskey={selected2FAPasskey}
        onCallback={(verifiedAssertion) => {
          void verifyDeletionWithPasskey(verifiedAssertion);
        }}
        onTryAnotherWayHandler={() => {
          setDeletionVerificationProofId("");
          setVerificationMethod(null);
          setErrorCode("");
          setCustomErrorMessage("");
          setSelected2FAPasskey(null);
          setAssertionResult(null);
          setWizardStep("otpSelection");
        }}
      />
    ),
  };

  return localLoading || validatePasswordLoading || passkeyLoading ? (
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
