import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";
import { fido2Api } from "../../api/fido2Api";
import {
  authenticateFIDO2Credential,
  isWebAuthnSupported,
} from "../../utils/webAuthnUtils";
import { useTranslation } from "react-i18next";
import FIDOPasskeyCollage from "../../../../assets/icons/passkey_collage.svg?react";
import Loader from "../../../../components/Layout/Loading";
import type { Fido2Credential } from "../../../../types/hooks";

interface VerifyFIDO2PasskeyProps {
  setErrorCode: (code: string) => void;
  setAssertionResult?: (assertionResult: unknown) => void;
  onCallback?: () => Promise<void> | void;
  submitAttestationResult?: boolean;
  errorMessage: string;
  selectedPasskey?: Fido2Credential | null;
  onTryAnotherWayHandler?: () => void;
  assertionOptionsRequest?: {
    userVerification?: "required" | "preferred" | "discouraged";
  };
  onError?: (errorCode: string) => void;
}

export default function VerifyFIDO2Passkey({
  setErrorCode,
  setAssertionResult,
  onCallback,
  submitAttestationResult = false,
  errorMessage,
  selectedPasskey,
  onTryAnotherWayHandler,
  assertionOptionsRequest,
  onError,
}: VerifyFIDO2PasskeyProps) {
  const { language } = useParams();
  const { t } = useTranslation(["fido2", "common"]);
  const hasTriggeredRef = useRef(false);
  const [localLoading, setLocalLoading] = useState(true);

  /**
   * Trigger FIDO2 authentication flow
   */
  const handleFIDO2Verification = async () => {
    setLocalLoading(true);
    setErrorCode("");
    // Prevent multiple calls - persist across strict mode remounts
    if (hasTriggeredRef.current) {
      return;
    }

    // Set flag immediately and permanently (don't reset even on error)
    hasTriggeredRef.current = true;

    try {
      // Check WebAuthn browser support
      if (!isWebAuthnSupported()) {
        setErrorCode("error_webauthn_not_supported");
        onError?.("error_webauthn_not_supported");
        return;
      }

      // Step 1: Get assertion options from server
      const optionsResponse = (await fido2Api.getAssertionOptions(
        assertionOptionsRequest,
      )) as
        | {
            success?: boolean;
            data?: Record<string, unknown> & {
              allowCredentials?: Array<{ id: string }>;
            };
          }
        | undefined;

      if (!optionsResponse?.success) {
        throw new Error(
          t("Error.error_get_assertion_options", { ns: "common" }),
        );
      }
      setLocalLoading(false);
      const assertionData = { ...optionsResponse.data } as Record<
        string,
        unknown
      > & { allowCredentials?: Array<{ id: string }> };

      // If a specific credential is required, filter allowCredentials to only that one
      if (
        selectedPasskey?.attributes?.credentialId &&
        assertionData.allowCredentials
      ) {
        assertionData.allowCredentials = assertionData.allowCredentials.filter(
          (cred) => cred.id === selectedPasskey.attributes!.credentialId,
        );

        // If no matching credentials after filtering, the passkey was deleted server-side
        if (assertionData.allowCredentials.length === 0) {
          setErrorCode("error_fido2_passkey_deleted");
          onError?.("error_fido2_passkey_deleted");
          return;
        }
      }

      // Step 2: Use WebAuthn API to authenticate with the passkey
      const assertionResult = await authenticateFIDO2Credential(assertionData);
      setAssertionResult?.(assertionResult);

      // Step 3 (optional): Submit the assertion result now if needed for immediate verification
      if (submitAttestationResult) {
        await fido2Api.submitAssertionResult(assertionResult);
      }
      await onCallback?.();
    } catch (err) {
      console.error("error_fido2_verification", err);
      // Failed auth response: cancelled or timed out by the user or the browser
      setErrorCode("error_fido2_verification");
      onError?.("error_fido2_verification");
    } finally {
      setLocalLoading(false);
      hasTriggeredRef.current = false;
    }
  };

  // Automatically trigger FIDO2 verification when component mounts
  useEffect(() => {
    void handleFIDO2Verification();
    // No cleanup needed - flag persists across remounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return localLoading ? (
    <Loader text={t("VerifyFIDO2Passkey.loading")} />
  ) : (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("VerifyFIDO2Passkey.title")}
        </GcdsHeading>
        <GcdsText>
          {t("VerifyFIDO2Passkey.passkeyNameDescription")}{" "}
          <strong>{selectedPasskey?.attributes?.nickname}</strong>
        </GcdsText>

        <GcdsContainer style={{ justifySelf: "center" }}>
          <FIDOPasskeyCollage aria-hidden="true" focusable="false" />
        </GcdsContainer>

        <GcdsText> {t("VerifyFIDO2Passkey.description")} </GcdsText>
      </GcdsGrid>
      {errorMessage && (
        <GcdsErrorMessage messageId="error-message">
          {errorMessage}
        </GcdsErrorMessage>
      )}
      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="primary"
          style={{ width: "fit-content" }}
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            await handleFIDO2Verification();
          }}
        >
          {t("VerifyFIDO2Passkey.continueButton")}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={() => {
            setErrorCode("");
            onTryAnotherWayHandler?.();
          }}
        >
          {t("VerifyFIDO2Passkey.chooseADifferentMethod")}
        </GcdsButton>
      </GcdsGrid>

      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h2">
          {t("VerifyFIDO2Passkey.problemsTitle")}
        </GcdsHeading>

        {/* TODO: add correct hrefs to the links below once domain migrations are done */}
        <GcdsLink target="_blank">{t("VerifyFIDO2Passkey.helpLink")}</GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
