import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
} from "@cdssnc/gcds-components-react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api.jsx";
import { authenticateFIDO2Credential } from "../../../features/ManageFIDO2/utils/webAuthnUtils.js";

export default function FIDO2PasskeyList({ userFIDO2CredentialsData }) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);
  const [authenticating, setAuthenticating] = useState(false);

  const deletePasskeyPage = path(PAGES.deleteFIDO2PasskeyPage, {
    language: language,
  });
  const renamePasskeyPage = path(PAGES.renameFIDO2PasskeyPage, {
    language: language,
  });

  const handleAuthenticate = async () => {
    setAuthenticating(true);

    try {
      // Step 1: Get assertion options from server
      const optionsResponse = await fido2Api.getAssertionOptions();

      if (!optionsResponse?.success) {
        throw new Error("Failed to get assertion options");
      }

      // Step 2: Use WebAuthn API to authenticate with the passkey
      const assertionResult = await authenticateFIDO2Credential(
        optionsResponse.data,
      );

      // Step 3: Submit the assertion result to complete authentication
      const authResponse = await fido2Api.submitAssertionResult(
        assertionResult,
        true, // returnJwt = true for step-up authentication
      );

      if (authResponse?.success) {
        console.log("Authentication successful!", authResponse);
        // JWT is now stored in session on the backend
        alert(
          "Authentication successful! Step-up authentication is now active.",
        );
      } else {
        throw new Error("Authentication failed");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      alert(`Authentication failed: ${error.message || "Unknown error"}`);
    } finally {
      setAuthenticating(false);
    }
  };

  return userFIDO2CredentialsData.map(({ id, attributes, created }) => {
    return (
      <GcdsContainer key={id}>
        <GcdsText>
          <strong>{`${attributes.nickname}`}</strong>
        </GcdsText>
        <GcdsText>
          <strong>{pageContent["16"]}</strong>
          {new Date(created).toLocaleString()}
        </GcdsText>
        <GcdsGrid columns="max-content max-content max-content" gap="200">
          <GcdsButton
            id="rename-fido2-button"
            buttonRole="secondary"
            onGcdsClick={() => {
              navigate(`${renamePasskeyPage}`, {
                state: { passkeyId: id, passkeyNickname: attributes.nickname },
              });
            }}
          >
            {pageContent["14"]}
          </GcdsButton>
          <GcdsButton
            id="delete-fido2-button"
            buttonRole="secondary"
            onClick={() => {
              navigate(`${deletePasskeyPage}/${id}`);
            }}
          >
            {pageContent["13"]}
          </GcdsButton>
          <GcdsButton
            id="authenticate-fido2-button"
            buttonRole="primary"
            disabled={authenticating}
            onClick={() => handleAuthenticate(id)}
          >
            {authenticating ? "Authenticating..." : "Authenticate"}
          </GcdsButton>
        </GcdsGrid>
        <div className="separator" />
      </GcdsContainer>
    );
  });
}
