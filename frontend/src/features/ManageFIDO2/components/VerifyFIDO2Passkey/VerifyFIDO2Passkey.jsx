import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { fido2Api } from "../../api/fido2Api";
import { authenticateFIDO2Credential } from "../../utils/webAuthnUtils";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import { path } from "../../../../utils/routeHelpers";
import FIDOPasskeyCollage from "../../../../assets/icons/passkey_collage.svg?react";

export default function VerifyFIDO2Passkey({
  setAssertionResult,
  setErrorCode,
  onCallback,
  submitAttestationResult = false,
  errorMessage,
  selectedPasskey,
}) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContentJson = getPageContent(language, PAGES.verifyFIDO2Passkey);
  const errorPageContent = getPageContent(language, PAGES.error);
  const hasTriggeredRef = useRef(false);

  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  /**
   * Trigger FIDO2 authentication flow
   */
  const handleFIDO2Verification = async () => {
    // Prevent multiple calls - persist across strict mode remounts
    if (hasTriggeredRef.current) {
      return;
    }

    // Set flag immediately and permanently (don't reset even on error)
    hasTriggeredRef.current = true;

    try {
      // Step 1: Get assertion options from server
      const optionsResponse = await fido2Api.getAssertionOptions();

      if (!optionsResponse?.success) {
        throw new Error(errorPageContent["error_get_assertion_options"]);
      }

      const assertionData = { ...optionsResponse.data };

      // If a specific credential is required, filter allowCredentials to only that one
      if (
        selectedPasskey?.attributes?.credentialId &&
        assertionData.allowCredentials
      ) {
        assertionData.allowCredentials = assertionData.allowCredentials.filter(
          (cred) => cred.id === selectedPasskey.attributes.credentialId,
        );
      }

      // Step 2: Use WebAuthn API to authenticate with the passkey
      const assertionResult = await authenticateFIDO2Credential(assertionData);

      // Step 3: Store assertion result and proceed to confirmation
      setAssertionResult?.(assertionResult);

      // Step 4 (optional): Submit the assertion result now if needed for immediate verification
      if (submitAttestationResult) {
        await fido2Api.submitAssertionResult(assertionResult);
      }

      onCallback?.();
    } catch (err) {
      console.error("error_fido2_verification", err);
      setErrorCode("error_fido2_verification");
    } finally {
      hasTriggeredRef.current = false;
    }
  };

  // Automatically trigger FIDO2 verification when component mounts
  useEffect(() => {
    handleFIDO2Verification();
    // No cleanup needed - flag persists across remounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {pageContentJson["1"]}
        </GcdsHeading>
        <GcdsText>
          {pageContentJson["1"]}{" "}
          <strong>{selectedPasskey?.attributes?.nickname}</strong>
        </GcdsText>

        <FIDOPasskeyCollage />

        <GcdsText> {pageContentJson["2"]} </GcdsText>
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
          {pageContentJson["4"]}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            navigate(backToManage2FAVerificationsPage);
          }}
        >
          {pageContentJson["3"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
