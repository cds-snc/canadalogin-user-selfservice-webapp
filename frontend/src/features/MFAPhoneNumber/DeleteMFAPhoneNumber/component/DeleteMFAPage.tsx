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
  const { t } = useTranslation("security");

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
      // If there's only one MFA factor, skip OTP selection and go directly to validation
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step:
          userPhoneFactors &&
          userPhoneFactors.length === 1 &&
          fido2Data.length === 0
            ? DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION
            : DELETE_MFA_ANALYTICS.STEPS.OTP_SELECTION,
      });
      if (
        userPhoneFactors &&
        userPhoneFactors.length === 1 &&
        fido2Data.length === 0
      ) {
        const success = await requestOtpCode();
        if (success) {
          setWizardStep("otpValidation");
        }
      } else {
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
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
  });

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
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

  const deleteMFA = async () => {
    try {
      const verificationOtpType =
        assertionResult || !phoneFormData.mfaFactorsToDelete.length
          ? undefined
          : userSelectedMfaFactor
            ? serverMapping[
                userSelectedMfaFactor.type as keyof typeof serverMapping
              ]
            : serverMapping[
                phoneFormData.mfaFactorsToDelete[0]
                  ?.type as keyof typeof serverMapping
              ];

      if (phoneFormData.mfaFactorsToDelete.length > 1) {
        // Multiple factors tied to the same phone number — verify OTP once and
        // delete all in a single batch request.  IBM Verify trxnIds are
        // single-use, so sequential calls with the same trxnId would fail.
        await deleteMFAPhoneNumberApi.deleteMFABatch({
          factors: phoneFormData.mfaFactorsToDelete.map((f) => ({
            id: f.id,
            otpType: serverMapping[f.type as keyof typeof serverMapping],
          })),
          ...(assertionResult
            ? { assertionResult }
            : {
                otp: userOtpValue,
                trxnId: otpSentResponse?.trxnId ?? "",
                otpVerificationType: verificationOtpType,
              }),
        });
      } else {
        const [firstFactor] = phoneFormData.mfaFactorsToDelete;
        await deleteMFAPhoneNumberApi.deleteMFA({
          id: firstFactor.id,
          otpType:
            serverMapping[firstFactor.type as keyof typeof serverMapping],
          ...(assertionResult
            ? { assertionResult }
            : {
                otp: userOtpValue,
                trxnId: otpSentResponse?.trxnId,
                otpVerificationType: verificationOtpType,
              }),
        });
      }

      trackEvent({
        event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
        step: DELETE_MFA_ANALYTICS.STEPS.SUCCESS,
      });
      setErrorCode("");
      navigate(backToManage2FAVerificationsPage, {
        state: {
          noticeType: "mfaDeleted",
          phoneNumber: phoneFormData.formattedPhoneNumber,
        },
      });
    } catch (error) {
      const err = error as { data?: { message?: string } };
      const message = err?.data?.message ?? "";
      setErrorCode(message);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
        error: message,
      });
      if (
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(
          err?.data?.message ?? "",
        )
      ) {
        // If OTP is invalid, go back to OTP validation step
        setWizardStep("otpValidation");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
        });
      }
    }
  };

  // Custom validateOtpCode that handles delete MFA flow
  const validateOtpCode = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: DELETE_MFA_ANALYTICS.STEPS.OTP_VALIDATION,
    });
    setWizardStep("deleteMFAPhoneNumberConfirm");
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
      step: DELETE_MFA_ANALYTICS.STEPS.CONFIRM_DELETE,
    });
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
        parentPage={PAGES.addMFAPage}
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
        setAssertionResult={setAssertionResult}
        selectedPasskey={selected2FAPasskey}
        onCallback={() => {
          setWizardStep("deleteMFAPhoneNumberConfirm");
        }}
        onTryAnotherWayHandler={() => {
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
