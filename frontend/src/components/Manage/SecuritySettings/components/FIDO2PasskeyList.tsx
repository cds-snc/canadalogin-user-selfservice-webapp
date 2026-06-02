import {
  GcdsButton,
  GcdsContainer,
  GcdsText,
  GcdsGrid,
  GcdsInput,
  GcdsSrOnly,
} from "@gcds-core/components-react";
import { useLocation, useNavigate, useParams } from "react-router";
import { PAGES } from "../../../../utils/constants";
import { useTranslation } from "react-i18next";
import { path } from "../../../../utils/routeHelpers";
import { useState } from "react";
import { fido2Api } from "../../../../features/ManageFIDO2/api/fido2Api";
import type { Fido2Credential } from "../../../../types/hooks";
import { useFormTracking } from "../../../../hooks/useFormTracking";
import {
  GA_FORM_EVENTS,
  RENAME_PASSKEY_ANALYTICS,
} from "../../../../utils/analyticsConstants";
import { trackPage } from "../../../../utils/gatag";

interface Fido2CredentialWithCreated extends Fido2Credential {
  created?: string;
  attributes?: {
    nickname?: string;
    [key: string]: unknown;
  };
}

interface FIDO2PasskeyListProps {
  userFIDO2CredentialsData: Fido2CredentialWithCreated[];
  totalFactorCount?: number;
  setErrorCode?: (errorCode: string) => void;
  errorMessage?: string;
}

interface RenameRegistrationResponse {
  success?: boolean;
}

const RENAME_PASSKEY_ERROR_CODE = "error_rename_credential";
const RENAME_PASSKEY_PAGE_IDS = {
  EDIT: "RenamePasskeyEdit",
  SUCCESS: "RenamePasskeySuccess",
} as const;

export default function FIDO2PasskeyList({
  userFIDO2CredentialsData,
  totalFactorCount,
  errorMessage = "",
  setErrorCode = () => {},
}: FIDO2PasskeyListProps) {
  const { language } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation(["mfa", "common"]);
  const [loading, setLoading] = useState(false);
  const [editingPasskeyId, setEditingPasskeyId] = useState<string | null>(null);
  const [savedPasskeyNicknames, setSavedPasskeyNicknames] = useState<
    Record<string, string>
  >({});
  const [passkeyNicknameInputs, setPasskeyNicknameInputs] = useState<
    Record<string, string>
  >({});

  const deletePasskeyPage = path(PAGES.deleteFIDO2PasskeyPage, {
    language,
  });

  const { trackEvent } = useFormTracking({
    formId: RENAME_PASSKEY_ANALYTICS.FLOW_ID,
  });

  const renamePasskeyStep = RENAME_PASSKEY_ANALYTICS.STEPS.RENAME_PASSKEY;

  const trackRenamePasskeyEvent = (
    event: (typeof GA_FORM_EVENTS)[keyof typeof GA_FORM_EVENTS],
    error?: string,
  ) => {
    trackEvent({
      event,
      step: renamePasskeyStep,
      ...(error ? { error } : {}),
    });
  };

  const clearPasskeyNicknameInput = (passkeyId: string) => {
    setPasskeyNicknameInputs((previous) => {
      const next = { ...previous };
      delete next[passkeyId];
      return next;
    });
  };

  const handleRenameFIDO2 = async (
    passkeyId: string,
    renameDeviceName: string,
  ) => {
    const trimmedNickname = renameDeviceName.trim();

    if (!passkeyId || !trimmedNickname) {
      setErrorCode(RENAME_PASSKEY_ERROR_CODE);
      trackRenamePasskeyEvent(GA_FORM_EVENTS.FORM_SUBMIT, RENAME_PASSKEY_ERROR_CODE);
      return;
    }

    trackRenamePasskeyEvent(GA_FORM_EVENTS.FORM_SUBMIT);

    setLoading(true);
    setErrorCode("");

    try {
      const response = (await fido2Api.updateRegistration(passkeyId, {
        nickname: trimmedNickname,
      })) as RenameRegistrationResponse | undefined;

      if (!response?.success) {
        throw new Error(t("Error.error_rename_credential", { ns: "common" }));
      }

      setSavedPasskeyNicknames((previous) => ({
        ...previous,
        [passkeyId]: trimmedNickname,
      }));
      clearPasskeyNicknameInput(passkeyId);
      trackRenamePasskeyEvent(GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE);
      trackPage(pathname, RENAME_PASSKEY_PAGE_IDS.SUCCESS);
    } catch (error) {
      console.error([RENAME_PASSKEY_ERROR_CODE], error);
      setErrorCode(RENAME_PASSKEY_ERROR_CODE);
      trackRenamePasskeyEvent(
        GA_FORM_EVENTS.FORM_STEP_END,
        RENAME_PASSKEY_ERROR_CODE,
      );
    } finally {
      setLoading(false);
      setEditingPasskeyId(null);
    }
  };

  return userFIDO2CredentialsData.map(({ id, attributes, created }) => {
    const isEditing = editingPasskeyId === id;
    const savedNickname =
      savedPasskeyNicknames[id] ?? attributes?.nickname ?? "";
    const nicknameValue = isEditing
      ? (passkeyNicknameInputs[id] ?? savedNickname)
      : savedNickname;
    const canDeletePasskey =
      totalFactorCount === undefined ? true : totalFactorCount - 1 >= 1;

    return (
      <GcdsContainer key={id}>
        {isEditing ? (
          <GcdsInput
            label={t("Manage2FAVerifications.nameLabel")}
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
          {t("Manage2FAVerifications.createdOn")}
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
                {t("Manage2FAVerifications.saveButton")}
              </GcdsButton>
              <GcdsButton
                id="cancel-fido2-button"
                buttonRole="secondary"
                onClick={() => {
                  clearPasskeyNicknameInput(id);
                  setEditingPasskeyId(null);
                  trackRenamePasskeyEvent(GA_FORM_EVENTS.FORM_STEP_END);
                }}
                disabled={loading}
              >
                {t("Manage2FAVerifications.cancelButton")}
              </GcdsButton>
            </>
          ) : (
            <>
              <GcdsButton
                id="rename-fido2-button"
                buttonRole="secondary"
                onGcdsClick={() => {
                  trackRenamePasskeyEvent(GA_FORM_EVENTS.FORM_STEP_START);
                  trackPage(pathname, RENAME_PASSKEY_PAGE_IDS.EDIT);
                  setEditingPasskeyId(id);
                }}
              >
                <span aria-hidden="true">
                  {t("Manage2FAVerifications.renamePasskey")}
                </span>
                <GcdsSrOnly tag="span">
                  {t("Manage2FAVerifications.renamePasskey")} {nicknameValue}
                </GcdsSrOnly>
              </GcdsButton>
              {canDeletePasskey && (
                <GcdsButton
                  aria-label="abc"
                  id="delete-fido2-button"
                  buttonRole="secondary"
                  onClick={() => {
                    navigate(`${deletePasskeyPage}`, {
                      state: { passkeyId: id, passkeyNickname: nicknameValue },
                    });
                  }}
                >
                  {t("Manage2FAVerifications.deletePasskey")}
                  <GcdsSrOnly tag="span"> {nicknameValue}</GcdsSrOnly>
                </GcdsButton>
              )}
            </>
          )}
        </GcdsGrid>
        <div className="separator" />
      </GcdsContainer>
    );
  });
}
