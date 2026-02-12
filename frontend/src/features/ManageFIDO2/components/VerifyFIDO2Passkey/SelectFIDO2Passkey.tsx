import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import { fido2Api } from "../../api/fido2Api";
import { authenticateFIDO2Credential } from "../../utils/webAuthnUtils";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
import { path } from "../../../../utils/routeHelpers";

type SelectFIDO2PasskeyProps = {
  setAssertionResult?: (res: any) => void;
  setErrorCode?: (code: string | null) => void;
  onCallback?: () => void;
  submitAttestationResult?: boolean;
};

export default function SelectFIDO2Passkey({
  setAssertionResult,
  setErrorCode,
  onCallback,
  submitAttestationResult = false,
}: SelectFIDO2PasskeyProps) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContentJson = getPageContent(language, PAGES.selectFIDO2Passkey);
  const errorPageContent = getPageContent(language, PAGES.error);
  const hasTriggeredRef = useRef<boolean>(false);

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

      // Step 2: Use WebAuthn API to authenticate with the passkey
      const assertionResult = await authenticateFIDO2Credential(
        optionsResponse.data,
      );

      // Step 3: Store assertion result and proceed to confirmation
      setAssertionResult?.(assertionResult);

      // Step 4 (optional): Submit the assertion result now if needed for immediate verification
      if (submitAttestationResult) {
        await fido2Api.submitAssertionResult(
          assertionResult,
          true, // returnJwt = true for step-up authentication
        );
      }

      onCallback?.();
    } catch (err) {
      console.error(errorPageContent["error_fido2_verification"], err);
      setErrorCode(errorPageContent["error_fido2_verification"]);
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
      <GcdsGrid columns="1" gap="500">
        <GcdsContainer>
          <GcdsHeading tag="h1" lang={language}>
            {pageContentJson["heading"]}
          </GcdsHeading>
          <GcdsText>{pageContentJson["instruction"]}</GcdsText>
        </GcdsContainer>
      </GcdsGrid>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(backToManage2FAVerificationsPage);
          }}
        >
          {pageContentJson["cancel_button"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
