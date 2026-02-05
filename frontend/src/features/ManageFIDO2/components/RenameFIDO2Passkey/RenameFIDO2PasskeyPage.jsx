import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { getPageContent } from "../../../../utils/functions";
import { PAGES } from "../../../../utils/constants";
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

export function RenameFIDO2PasskeyPage() {
  const { language } = useParams();
  const location = useLocation();
  const passkeyId = location.state?.passkeyId;
  const pageContent = getPageContent(language, PAGES.renameFIDO2PasskeyPage);
  const errorPageContent = getPageContent(language, PAGES.error);
  const [renameDeviceName, setRenameDeviceName] = useState(
    location.state?.passkeyNickname || "",
  );
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const backToManage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });
  const navigate = useNavigate();

  /**
   * Handle renaming FIDO2 credential
   */
  const handleRenameFIDO2 = async () => {
    if (!passkeyId || !renameDeviceName.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fido2Api.updateRegistration(passkeyId, {
        nickname: renameDeviceName.trim(),
      });

      if (response && response.success) {
        setRenameDeviceName("");
        navigate(backToManage2FAVerificationsPage, {
          state: {
            noticeType: "passkeyRenamed",
            passkeyName: renameDeviceName.trim(),
          },
        });
      } else {
        throw new Error(errorPageContent["error_rename_credential"]);
      }
    } catch (err) {
      console.error(errorPageContent["error_rename_credential"], err);
      setErrorMessage(errorPageContent["error_rename_credential"]);
    } finally {
      setLoading(false);
    }
  };
  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {pageContent["1"]}
      </GcdsHeading>
      <GcdsText>{pageContent["2"]}</GcdsText>
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await handleRenameFIDO2();
        }}
      >
        {" "}
        <GcdsInput
          inputId="rename-device-name"
          label={pageContent["3"]}
          value={renameDeviceName}
          onGcdsInput={(e) => setRenameDeviceName(e.target.value)}
          required={true}
        />
      </form>

      <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
        <GcdsButton
          onClick={async (e) => {
            e.preventDefault();
            await handleRenameFIDO2();
          }}
          disabled={loading}
        >
          {loading ? pageContent["5"] : pageContent["6"]}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={() => {
            navigate(backToManage2FAVerificationsPage);
          }}
          disabled={loading}
        >
          {pageContent["cancel"] || "Cancel"}
        </GcdsButton>
      </div>
    </GcdsContainer>
  );
}
