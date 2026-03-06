import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
  GcdsInput,
} from "@cdssnc/gcds-components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants.jsx";
import { getPageContent } from "../../../utils/functions.jsx";
import { path } from "../../../utils/routeHelpers.js";
import { useState } from "react";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api.jsx";

export default function FIDO2PasskeyList({
  userFIDO2CredentialsData,
  onRenameSuccess,
}) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent = getPageContent(language, PAGES.manage2FAVerifications);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPasskeyId, setEditingPasskeyId] = useState(null);
  const [passkeyNicknameInputs, setPasskeyNicknameInputs] = useState({});
  const errorPageContent = getPageContent(language, PAGES.error);

  const deletePasskeyPage = path(PAGES.deleteFIDO2PasskeyPage, {
    language: language,
  });

  /**
   * Handle renaming FIDO2 credential
   */
  const handleRenameFIDO2 = async (passkeyId, renameDeviceName) => {
    if (!passkeyId || !renameDeviceName.trim()) return;

    setLoading(true);
    setErrorMessage(null);

    try {
      const response = await fido2Api.updateRegistration(passkeyId, {
        nickname: renameDeviceName.trim(),
      });

      if (response && response.success) {
        await onRenameSuccess?.();
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

  return userFIDO2CredentialsData.map(({ id, attributes, created }) => {
    const isEditing = editingPasskeyId === id;
    const nicknameValue = passkeyNicknameInputs[id] ?? attributes.nickname;

    return (
      <GcdsContainer key={id}>
        {isEditing ? (
          <GcdsInput
            inputId="passkeyNickname"
            name="passkeyNickname"
            type="text"
            validateOn="other"
            data-testid="passkeyNickname"
            lang={language}
            errorMessage={errorMessage}
            value={nicknameValue}
            onInput={(e) => {
              setPasskeyNicknameInputs((prev) => ({
                ...prev,
                [id]: e.target.value,
              }));
            }}
          />
        ) : (
          <GcdsText>
            <strong>{`${attributes.nickname}`}</strong>
          </GcdsText>
        )}
        <GcdsText>
          <span style={{ color: "#595959" }}>
            {pageContent["16"]}
            {new Date(created).toLocaleDateString()}
          </span>
        </GcdsText>
        <GcdsGrid columns="max-content max-content max-content" gap="200">
          {isEditing ? (
            <GcdsButton
              id="save-fido2-button"
              buttonRole="primary"
              onGcdsClick={async () => {
                await handleRenameFIDO2(id, nicknameValue);
                setEditingPasskeyId(null);
              }}
              disabled={loading}
            >
              {pageContent["22"]}
            </GcdsButton>
          ) : (
            <GcdsButton
              id="rename-fido2-button"
              buttonRole="secondary"
              onGcdsClick={() => {
                setEditingPasskeyId(id);
              }}
            >
              {pageContent["14"]}
            </GcdsButton>
          )}
          <GcdsButton
            id="delete-fido2-button"
            buttonRole="secondary"
            onClick={() => {
              navigate(`${deletePasskeyPage}`, {
                state: { passkeyId: id, passkeyNickname: attributes.nickname },
              });
            }}
          >
            {pageContent["13"]}
          </GcdsButton>
        </GcdsGrid>
        <div className="separator" />
      </GcdsContainer>
    );
  });
}
