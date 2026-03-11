import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
  GcdsInput,
} from "@cdssnc/gcds-components-react";
import { useNavigate, useParams } from "react-router";
import { PAGES } from "../../../utils/constants";
import { getPageContent } from "../../../utils/functions";
import { path } from "../../../utils/routeHelpers";
import { useState } from "react";
import { fido2Api } from "../../../features/ManageFIDO2/api/fido2Api";
import type { Fido2Credential } from "../../../types/hooks";

interface Fido2CredentialWithCreated extends Fido2Credential {
  created?: string;
  attributes?: {
    nickname?: string;
    [key: string]: unknown;
  };
}

interface FIDO2PasskeyListProps {
  userFIDO2CredentialsData: Fido2CredentialWithCreated[];
  onRenameSuccess?: () => Promise<void> | void;
}

interface RenameRegistrationResponse {
  success?: boolean;
}

export default function FIDO2PasskeyList({
  userFIDO2CredentialsData,
  onRenameSuccess,
}: FIDO2PasskeyListProps) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent: Record<string, string> =
    getPageContent(language, PAGES.manage2FAVerifications) ?? {};
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [passkeyNicknameInputs, setPasskeyNicknameInputs] = useState<
    Record<string, string>
  >({});
  const errorPageContent: Record<string, string> =
    getPageContent(language, PAGES.error) ?? {};

  const deletePasskeyPage = path(PAGES.deleteFIDO2PasskeyPage, {
    language,
  });

  const handleRenameFIDO2 = async (
    passkeyId: string,
    renameDeviceName: string,
  ) => {
    if (!passkeyId || !renameDeviceName.trim()) return;

    setLoading(true);
    setErrorMessage("");

    try {
      const response = (await fido2Api.updateRegistration(passkeyId, {
        nickname: renameDeviceName.trim(),
      })) as RenameRegistrationResponse | undefined;

      if (response?.success) {
        await onRenameSuccess?.();
      } else {
        throw new Error(errorPageContent["error_rename_credential"]);
      }
    } catch (error) {
      console.error(errorPageContent["error_rename_credential"], error);
      setErrorMessage(errorPageContent["error_rename_credential"]);
    } finally {
      setLoading(false);
    }
  };

  return userFIDO2CredentialsData.map(({ id, attributes, created }) => {
    const isEditing = editingPasskeyId === id;
    const nicknameValue =
      passkeyNicknameInputs[id] ?? attributes?.nickname ?? "";

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
            onInput={(event) => {
              const nextValue = (event.target as HTMLInputElement).value;

              setPasskeyNicknameInputs((previous) => ({
                ...previous,
                [id]: nextValue,
              }));
            }}
          />
        ) : (
          <GcdsText>
            <strong>{nicknameValue}</strong>
          </GcdsText>
        )}
        <GcdsText>
          <span style={{ color: "#595959" }}>
            {pageContent["16"]}
            {created ? new Date(created).toLocaleDateString() : ""}
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
                state: { passkeyId: id, passkeyNickname: nicknameValue },
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
