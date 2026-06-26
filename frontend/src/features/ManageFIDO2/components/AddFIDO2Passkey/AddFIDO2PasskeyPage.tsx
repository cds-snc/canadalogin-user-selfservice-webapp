import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../../components/Providers/useUser";
import { useEffect, useState } from "react";
import { path } from "../../../../utils/routeHelpers";
import {
  INVALID_OTP_ERROR_CODES,
  NOTICE_TYPES,
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
import { useTranslation } from "react-i18next";
import StepContent from "../../../../components/Wizard/StepContent";
import Loader from "../../../../components/Layout/Loading";
import AddFIDO2Passkey from "./AddFIDO2Passkey";
import AddFIDO2PasskeyNickname from "./AddFIDO2PasskeyNickname";
import VerifyFIDO2Passkey from "../VerifyFIDO2Passkey/VerifyFIDO2Passkey";
import { usePasskeyOperations } from "../../../../hooks/usePasskeyOperations";
import { fido2Api } from "../../api/fido2Api";
import {
  isWebAuthnSupported,
  registerFIDO2Credential,
} from "../../utils/webAuthnUtils";
import type { Fido2Credential } from "../../../../types/hooks";
import { useFormTracking } from "../../../../hooks/useFormTracking";
import { useWizardPageTracking } from "../../../../hooks/useWizardPageTracking";
import {
  GA_FORM_EVENTS,
  ADD_PASSKEY_ANALYTICS,
} from "../../../../utils/analyticsConstants";

interface AddFIDO2PasskeyPageProps {
  step?: string;
}

const ADD_PASSKEY_PAGE_BY_STEP: Record<string, string> = {
  passwordVerification: "AddPasskeyVerifyIdentity",
  otpSelection: "AddPasskeyOtpSelection",
  otpValidation: "AddPasskeyOtpValidation",
  verifyFIDO2Passkey: "AddPasskeyVerifyPasskey",
  addFIDO2Passkey: "AddPasskeyRegister",
  addFIDO2PasskeyNickname: "AddPasskeySetNickname",
};

export default function AddFIDO2PasskeyPage({
  step,
}: AddFIDO2PasskeyPageProps) {
  const { language } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const [customErrorMessage, setCustomErrorMessage] = useState("");
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const errorMessage =
    customErrorMessage || getErrorMessage(language, errorCode);
  const { t } = useTranslation(["security", "fido2"]);
  const [userPasswordValue, setUserPasswordValue] = useState("");
  const [selected2FAPasskey, setSelected2FAPasskey] =
    useState<Fido2Credential | null>(null);
  const [attestationResult, setAttestationResult] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [registrationLoading, setRegistrationLoading] = useState(false);
  const [authenticatorDescription, setAuthenticatorDescription] = useState("");

  const backToSecuritySettingsPage = path(PAGES.securitySettings, {
    language: language,
  });
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Initialize form tracking
  const { trackEvent } = useFormTracking({
    formId: ADD_PASSKEY_ANALYTICS.FLOW_ID,
  });

  useWizardPageTracking(wizardStep, ADD_PASSKEY_PAGE_BY_STEP);

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
    allowEmptyFactors: true,
  });

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
            step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          setWizardStep("otpValidation");
        }
      } else {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_SELECTION,
        });
        setWizardStep("otpSelection");
      }
    },
    false,
    (message) => {
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: ADD_PASSKEY_ANALYTICS.STEPS.VERIFY_PASSWORD,
        error: message,
      });
    },
  );

  // Create tracked password validation wrapper
  async function handleValidatePassword(password: string) {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: ADD_PASSKEY_ANALYTICS.STEPS.VERIFY_PASSWORD,
      flow: ADD_PASSKEY_ANALYTICS.FLOW_ID,
    });
    await validatePassword(password);
  }

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    enabled: true,
    setErrorCode,
  });

  /**
   * Step 1 of passkey registration: get attestation options from server and
   * trigger the browser WebAuthn popup. Stores the attestation result so the
   * nickname step can submit it.
   */
  const handleGetAttestationOptions = async () => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
    });
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
      flow: ADD_PASSKEY_ANALYTICS.FLOW_ID,
    });

    if (!isWebAuthnSupported()) {
      setErrorCode("error_webauthn_not_supported");
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
        error: "error_webauthn_not_supported",
      });
      return;
    }

    setRegistrationLoading(true);
    setErrorCode("");

    try {
      const attestationResponse = (await fido2Api.getAttestationOptions()) as
        | { success?: boolean; data?: Record<string, unknown> }
        | undefined;

      if (!attestationResponse?.success || !attestationResponse?.data) {
        setErrorCode("error_failed_to_get_attestation_options");
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_END,
          step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
          error: "error_failed_to_get_attestation_options",
        });
        return;
      }
      setRegistrationLoading(false);

      // Trigger the browser WebAuthn popup — nickname is not known yet
      const result = await registerFIDO2Credential(attestationResponse.data);
      setAttestationResult(result as unknown as Record<string, unknown>);

      // Look up authenticator description from MDS service using AAGUID
      if (result.aaguid) {
        const metadata = await fido2Api.getAuthenticatorMetadata(result.aaguid);
        setAuthenticatorDescription(
          !!metadata?.description
            ? metadata?.description
            : t("AddFIDO2PasskeyNickname.defaultPasskeyName", { ns: "fido2" }),
        );
      }

      trackEvent({
        event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
        step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
      });
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
        step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_NICKNAME,
      });
      setWizardStep("addFIDO2PasskeyNickname");
    } catch (err) {
      const errCode =
        err instanceof DOMException && err.name === "InvalidStateError"
          ? "error_duplicate_passkey"
          : "error_fido2_verification";
      setErrorCode(errCode);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
        error: errCode,
      });
    } finally {
      setRegistrationLoading(false);
    }
  };

  /**
   * Step 2 of passkey registration: merge the device nickname into the stored
   * attestation result and send it to the server.
   */
  const handleSubmitAttestation = async (deviceName: string) => {
    trackEvent({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_NICKNAME,
    });
    trackEvent({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_NICKNAME,
      flow: ADD_PASSKEY_ANALYTICS.FLOW_ID,
    });

    setRegistrationLoading(true);
    setErrorCode("");

    try {
      const response = (await fido2Api.submitAttestationResult({
        ...attestationResult,
        nickname: deviceName.trim(),
      })) as { success?: boolean } | undefined;

      if (response && response.success) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_NICKNAME,
        });
        navigate(backToManage2FAVerificationsPage, {
          state: {
            noticeType: NOTICE_TYPES.passkeyAdded,
            passkeyName: deviceName.trim(),
          },
        });
      } else {
        throw new Error("Failed to register credential");
      }
    } catch (err) {
      const errCode =
        err instanceof DOMException && err.name === "InvalidStateError"
          ? "error_duplicate_passkey"
          : ((err as { data?: { message?: string } })?.data?.message ?? "");
      setErrorCode(errCode);
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_NICKNAME,
        error: errCode || "error_submit_attestation",
      });
      setRegistrationLoading(false);
    }
  };

  const validateOtpCode = async (userOtpValue: string) => {
    const userData = {
      otp: userOtpValue,
      trxnId: otpSentResponse!.trxnId,
      otpType:
        serverMapping[
          userSelectedMfaFactor!.type as keyof typeof serverMapping
        ],
    };
    try {
      const response = await authService.transientOtpVerify(userData);
      if (response && response.success) {
        trackEvent({
          event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
          step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
        });
        trackEvent({
          event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
          step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
        });
        setWizardStep("addFIDO2Passkey");
        setErrorCode("");
      }
    } catch (err) {
      const errData = err as {
        response?: { data?: { message?: string; retries?: number } };
      };
      const errorMessage = errData?.response?.data?.message;
      const hasRetries =
        errData?.response?.data?.retries !== undefined &&
        errData?.response?.data?.retries !== null;
      // When the backend returns retries info, re-throw so OtpVerification can
      // render "X retries remaining" / max-attempts. For other errors, surface
      // them via setErrorCode.
      if (!hasRetries && errorMessage) {
        setErrorCode(errorMessage);
      }
      trackEvent({
        event: GA_FORM_EVENTS.FORM_STEP_END,
        step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
        error: errorMessage || "error_otp_validation_failed",
      });
      if (hasRetries) {
        throw errData.response;
      }
    }
  };

  useEffect(() => {
    if ((INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorCode)) {
      // If OTP is invalid, go back to OTP selection step
      setWizardStep("otpValidation");
    }
  }, [errorCode]);

  const steps: Record<string, React.ReactNode> = {
    passwordVerification: (
      <PasswordVerification
        userPasswordValue={userPasswordValue}
        setUserPasswordValue={setUserPasswordValue}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        validatePassword={handleValidatePassword}
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        parentPage={PAGES.addFIDO2PasskeyPage}
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
                step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
              });
              setWizardStep("otpValidation");
            }
          })();
        }}
        onSelectFIDO2={(passkey) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: ADD_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
          });
          setSelected2FAPasskey(passkey);
          setWizardStep("verifyFIDO2Passkey");
        }}
        parentPage={PAGES.addFIDO2PasskeyPage}
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
            step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_START,
            step: ADD_PASSKEY_ANALYTICS.STEPS.OTP_VALIDATION,
            flow: ADD_PASSKEY_ANALYTICS.FLOW_ID,
            type: userSelectedMfaFactor?.type,
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
        assertionOptionsRequest={{ userVerification: "preferred" }}
        submitAttestationResult={true}
        errorMessage={errorMessage}
        setErrorCode={setErrorCode}
        selectedPasskey={selected2FAPasskey}
        onCallback={() => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
            step: ADD_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
          });
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_CHANGE,
            step: ADD_PASSKEY_ANALYTICS.STEPS.ADD_PASSKEY,
          });
          setWizardStep("addFIDO2Passkey");
        }}
        onTryAnotherWayHandler={() => {
          setSelected2FAPasskey(null);
          setWizardStep("otpSelection");
        }}
        onError={(errCode) => {
          trackEvent({
            event: GA_FORM_EVENTS.FORM_STEP_END,
            step: ADD_PASSKEY_ANALYTICS.STEPS.VERIFY_FIDO2,
            error: errCode,
          });
        }}
      />
    ),
    addFIDO2Passkey: (
      <AddFIDO2Passkey
        errorMessage={errorMessage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
        onRegister={handleGetAttestationOptions}
        registrationLoading={registrationLoading}
      />
    ),
    addFIDO2PasskeyNickname: (
      <AddFIDO2PasskeyNickname
        setErrorCode={setErrorCode}
        errorMessage={errorMessage}
        onSubmit={handleSubmitAttestation}
        registrationLoading={registrationLoading}
        initialNickname={authenticatorDescription}
      />
    ),
  };

  const isLoading =
    localLoading ||
    validatePasswordLoading ||
    passkeyLoading ||
    registrationLoading;

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
