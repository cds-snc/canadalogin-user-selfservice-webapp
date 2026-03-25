import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
  GcdsInput,
} from "@gcds-core/components-react";
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
  setErrorCode?: (errorCode: string) => void;
  errorMessage?: string;
}

interface RenameRegistrationResponse {
  success?: boolean;
}

export default function FIDO2PasskeyList({
  userFIDO2CredentialsData,
  onRenameSuccess,
  errorMessage = "",
  setErrorCode = () => {},
}: FIDO2PasskeyListProps) {
  const { language } = useParams();
  const navigate = useNavigate();
  const pageContent: Record<string, string> =
    getPageContent(language, PAGES.manage2FAVerifications) ?? {};
  const [loading, setLoading] = useState(false);
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
    if (!passkeyId || !renameDeviceName.trim()) {
      setErrorCode("error_rename_credential");
      return;
    }

    setLoading(true);
    setErrorCode("");

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
      console.error(["error_rename_credential"], error);
      setErrorCode("error_rename_credential");
    } finally {
      setLoading(false);
      setEditingPasskeyId(null);
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
            label={pageContent[24]}
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
        <GcdsText textRole="secondary">
          {pageContent["16"]}
          {created ? new Date(created).toLocaleDateString() : ""}
        </GcdsText>
        <GcdsGrid columns="max-content max-content max-content" gap="200">
          {isEditing ? (
            <>
              <GcdsButton
                id="save-fido2-button"
                buttonRole="primary"
                onGcdsClick={async () => {
                  await handleRenameFIDO2(id, nicknameValue);
                }}
                disabled={loading}
              >
                {pageContent["22"]}
              </GcdsButton>
              <GcdsButton
                id="cancel-fido2-button"
                buttonRole="secondary"
                onClick={() => {
                  setPasskeyNicknameInputs((previous) => {
                    const next = { ...previous };
                    delete next[id];
                    return next;
                  });
                  setEditingPasskeyId(null);
                }}
                disabled={loading}
              >
                {pageContent["23"]}
              </GcdsButton>
            </>
          ) : (
            <>
              <GcdsButton
                id="rename-fido2-button"
                buttonRole="secondary"
                onGcdsClick={() => {
                  setEditingPasskeyId(id);
                }}
              >
                {pageContent["14"]}
              </GcdsButton>
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
            </>
          )}
        </GcdsGrid>
        <div className="separator" />
      </GcdsContainer>
    );
  });
}
