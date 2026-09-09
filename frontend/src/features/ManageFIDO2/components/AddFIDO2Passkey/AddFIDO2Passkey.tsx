import { useParams } from "react-router";
import { Trans, useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import FIDOPasskeyCollage from "../../../../assets/icons/passkey_collage.svg?react";

interface AddFIDO2PasskeyProps {
  errorMessage: string;
  onCancel: () => void;
  onRegister: () => Promise<void>;
  registrationLoading: boolean;
}

export default function AddFIDO2Passkey({
  errorMessage,
  onCancel,
  onRegister,
  registrationLoading,
}: AddFIDO2PasskeyProps) {
  const { language: routeLanguage } = useParams<{ language?: string }>();
  const language: "en" | "fr" = routeLanguage === "fr" ? "fr" : "en";
  const { t } = useTranslation("fido2");

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("AddFIDO2Passkey.title")}
        </GcdsHeading>
        <GcdsContainer>
          <FIDOPasskeyCollage aria-hidden="true" focusable="false" />
        </GcdsContainer>
        <ol className="passkey-steps">
          <li>
            <GcdsText marginBottom="0">
              <strong>{t("AddFIDO2Passkey.step1")}</strong>
            </GcdsText>
            <GcdsText>{t("AddFIDO2Passkey.step1Description")}</GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              <strong>{t("AddFIDO2Passkey.step2")}</strong>
            </GcdsText>
          </li>
        </ol>
        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("AddFIDO2Passkey.infoTitle")}
          lang={language}
        >
          <ul>
            <li>
              <GcdsText marginBottom="0">
                <Trans
                  ns="fido2"
                  i18nKey="AddFIDO2Passkey.deviceWarning"
                  components={{ bold: <strong /> }}
                />
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("AddFIDO2Passkey.emailNotification")}
              </GcdsText>
            </li>
          </ul>
        </GcdsNotice>

        {errorMessage && (
          <GcdsErrorMessage messageId="message-props">
            {errorMessage}
          </GcdsErrorMessage>
        )}
        <GcdsButton
          onClick={async (e) => {
            e.preventDefault();
            await onRegister();
          }}
          disabled={registrationLoading}
        >
          {t("AddFIDO2Passkey.createButton")}
        </GcdsButton>
        <GcdsButton
          buttonRole="secondary"
          onClick={onCancel}
          disabled={registrationLoading}
        >
          {t("AddFIDO2Passkey.cancelButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
