import { useNavigate, useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { NOTICE_TYPES, PAGES } from "../../../../utils/constants";
import { useState } from "react";
import {
  isWebAuthnSupported,
  registerFIDO2Credential,
} from "../../utils/webAuthnUtils";
import { fido2Api } from "../../api/fido2Api";
import { path } from "../../../../utils/routeHelpers";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";

export default function AddFIDO2Passkey({
  setErrorCode,
  errorMessage,
  onCancel,
}) {
  const { language } = useParams();
  const pageContent = getPageContent(language, PAGES.addFIDO2Passkey);
  const errorPageContent = getPageContent(language, PAGES.error);
  const [newDeviceName, setNewDeviceName] = useState<string>("");
  const [registrationLoading, setRegistrationLoading] =
    useState<boolean>(false);
  const navigate = useNavigate();
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language: language,
  });

  // Check WebAuthn support
  const webAuthnSupported = isWebAuthnSupported();

  /**
   * Handle adding new FIDO2 credential
   */
  const handleAddFIDO2 = async () => {
    if (!webAuthnSupported) {
      setErrorCode(errorPageContent["error_webauthn_not_supported"]);
      return;
    }

    if (!newDeviceName || newDeviceName.trim() === "") {
      setErrorCode(errorPageContent["error_passkey_name_required"]);
      return;
    }

    setRegistrationLoading(true);
    setErrorCode(null);

    try {
      // Step 1: Get attestation options from server
      const attestationResponse = await fido2Api.getAttestationOptions();

      if (!attestationResponse?.success || !attestationResponse?.data) {
        setErrorCode(
          errorPageContent["error_failed_to_get_attestation_options"],
        );
        return;
      }

      // Extract the actual attestation options from the response
      const attestationOptions = attestationResponse.data;

      // Step 2: Use WebAuthn API to create credential
      const attestationResult = await registerFIDO2Credential(
        attestationOptions,
        newDeviceName,
      );

      // Step 3: Send attestation result to server
      const response =
        await fido2Api.submitAttestationResult(attestationResult);

      if (response && response.success) {
        navigate(backToManage2FAVerificationsPage, {
          state: {
            noticeType: NOTICE_TYPES.passkeyAdded,
            passkeyName: newDeviceName,
          },
        });
        setNewDeviceName("");
      } else {
        throw new Error("Failed to register credential");
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === "InvalidStateError") {
        setErrorCode("error_duplicate_passkey");
      } else {
        setErrorCode(
          err?.data?.message || "error_failed_to_register_credential",
        );
      }
    } finally {
      setRegistrationLoading(false);
    }
  };

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContent["1"]}
      </GcdsHeading>
      <GcdsText>{pageContent["7"]}</GcdsText>
      <GcdsText>{pageContent["2"]}</GcdsText>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleAddFIDO2();
        }}
      >
        {" "}
        <GcdsInput
          inputId="passkey-name"
          label={pageContent["3"]}
          value={newDeviceName}
          onGcdsInput={(e) => setNewDeviceName(e.target.value)}
          placeholder={pageContent["4"]}
          required={true}
        />
      </form>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <GcdsButton
          onClick={async (e) => {
            e.preventDefault();
            await handleAddFIDO2();
          }}
          disabled={registrationLoading}
        >
          {registrationLoading ? pageContent["5"] : pageContent["6"]}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onCancel}
          disabled={registrationLoading}
        >
          {pageContent["cancel"] || "Cancel"}
        </GcdsButton>
      </div>
    </GcdsContainer>
  );
}
