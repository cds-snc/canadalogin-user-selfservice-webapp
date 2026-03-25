import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../../components/Providers/useUser";
import { useEffect, useRef, useState } from "react";
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
import { getPageContent } from "../../../../utils/functions";
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
import type { Fido2Credential, OtpSentData } from "../../../../types/hooks";

interface AddFIDO2PasskeyPageProps {
  step?: string;
}

export default function AddFIDO2PasskeyPage({
  step,
}: AddFIDO2PasskeyPageProps) {
  const { language } = useParams();
  const { state } = useUser();
  const navigate = useNavigate();
  const [wizardStep, setWizardStep] = useState(step ?? "passwordVerification");
  const [errorCode, setErrorCode] = useState("");
  const { userProfile } = state;
  const { id, userName } = userProfile ?? {};
  const errorMessage = getErrorMessage(language, errorCode);
  const loaderPageContentJson = getPageContent(language, PAGES.otpSelection)!;
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

  // Use the OTP operations hook
  const {
    userPhoneFactors,
    userSelectedMfaFactor,
    userOtpValue,
    otpSentResponse,
    otpLoading: localLoading,
    handleChangeUserMfaSelection,
    handleSetUserOtpValue,
    setOtpSentResponse,
  } = useOtpOperations({
    userId: id,
    userName,
    setErrorCode,
    fallbackNavigationPath: backToSecuritySettingsPage,
  });

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

  const { fido2Data, loading: passkeyLoading } = usePasskeyOperations({
    setErrorCode,
  });

  const didFetch = useRef(false);

  /**
   * Step 1 of passkey registration: get attestation options from server and
   * trigger the browser WebAuthn popup. Stores the attestation result so the
   * nickname step can submit it.
   */
  const handleGetAttestationOptions = async () => {
    if (!isWebAuthnSupported()) {
      setErrorCode("error_webauthn_not_supported");
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
        return;
      }
      setRegistrationLoading(false);

      // Trigger the browser WebAuthn popup — nickname is not known yet
      const result = await registerFIDO2Credential(attestationResponse.data);
      setAttestationResult(result as unknown as Record<string, unknown>);

      // Look up authenticator description from MDS service using AAGUID
      if (result.aaguid) {
        const metadata = await fido2Api.getAuthenticatorMetadata(result.aaguid);
        setAuthenticatorDescription(metadata?.description ?? "");
      }

      setWizardStep("addFIDO2PasskeyNickname");
    } catch (err) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        setErrorCode("error_duplicate_passkey");
      } else {
        setErrorCode("error_fido2_verification");
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  /**
   * Step 2 of passkey registration: merge the device nickname into the stored
   * attestation result and send it to the server.
   */
  const handleSubmitAttestation = async (deviceName: string) => {
    setRegistrationLoading(true);
    setErrorCode("");

    try {
      const response = (await fido2Api.submitAttestationResult({
        ...attestationResult,
        nickname: deviceName.trim(),
      })) as { success?: boolean } | undefined;

      if (response && response.success) {
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
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        setErrorCode("error_duplicate_passkey");
      } else {
        const errData = err as { data?: { message?: string } };
        setErrorCode(errData?.data?.message ?? "");
      }
      setRegistrationLoading(false);
    }
  };

  const requestOtpCode = async () => {
    const userData = {
      user_id: userProfile!.id,
      factor_id: userSelectedMfaFactor!.id,
      otpType:
        serverMapping[
          userSelectedMfaFactor!.type as keyof typeof serverMapping
        ],
    };
    try {
      const response = await authService.transientOtpSend(userData);
      if (response && response.success) {
        setOtpSentResponse(response.data as OtpSentData);
        setErrorCode("");
      }
    } catch (err) {
      const errData = err as { data?: { message?: string } };
      if (errData && errData.data && errData.data.message) {
        setErrorCode(errData.data.message);
      }
    } finally {
      didFetch.current = false;
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
        // Navigate to confirmation URL while preserving state
        setWizardStep("addFIDO2Passkey");
        setErrorCode("");
      }
    } catch (err) {
      const errData = err as { response?: { data?: { message?: string } } };
      if (
        errData &&
        errData.response &&
        errData.response.data &&
        errData.response.data.message
      ) {
        setErrorCode(errData.response.data.message);
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
        validatePassword={validatePassword}
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
          setWizardStep("otpValidation");
        }}
        onSelectFIDO2={(passkey) => {
          setSelected2FAPasskey(passkey);
          setWizardStep("verifyFIDO2Passkey");
        }}
        parentPage={PAGES.addFIDO2PasskeyPage}
        onCancel={async () => navigate(backToManage2FAVerificationsPage)}
      />
    ),
    otpValidation: (
      <OtpVerification
        userProfile={userProfile}
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
          setWizardStep("addFIDO2Passkey");
        }}
        onTryAnotherWayHandler={() => {
          setSelected2FAPasskey(null);
          setWizardStep("otpSelection");
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
        onCancel={() => navigate(backToManage2FAVerificationsPage)}
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
    <Loader text={loaderPageContentJson["11"]} />
  ) : (
    <StepContent
      StepComponent={steps[wizardStep]}
      errorCode={errorCode}
      language={language}
    />
  );
}
