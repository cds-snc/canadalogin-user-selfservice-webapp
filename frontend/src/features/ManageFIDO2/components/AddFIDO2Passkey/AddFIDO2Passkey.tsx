import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
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
  const { language } = useParams();
  const { t } = useTranslation("fido2");

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("AddFIDO2Passkey.title")}
        </GcdsHeading>
        <GcdsContainer>
          <FIDOPasskeyCollage />
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
            <GcdsText>
              {t("AddFIDO2Passkey.selectEmailOnly")}{" "}
              <strong>{t("AddFIDO2Passkey.you")}</strong>{" "}
              {t("AddFIDO2Passkey.haveControlOver")}
            </GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              <strong>{t("AddFIDO2Passkey.step3")}</strong>
            </GcdsText>
          </li>
        </ol>
        <GcdsNotice
          noticeRole="warning"
          noticeTitleTag="h2"
          noticeTitle={" "}
          lang={language}
        >
          <GcdsText>
            {t("AddFIDO2Passkey.deviceWarning")}{" "}
            <strong>{t("AddFIDO2Passkey.youControl")}</strong>
          </GcdsText>
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

        <GcdsHeading tag="h2">{t("AddFIDO2Passkey.problemsTitle")}</GcdsHeading>

        {/* TODO: add link to create passkey help page once available */}
        <GcdsLink href="#" target="_blank">
          {t("AddFIDO2Passkey.helpLink")}
        </GcdsLink>
      </GcdsGrid>
    </GcdsContainer>
  );
}
