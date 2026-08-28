import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import EmailNotificationInfoNotice from "../../../../components/InfoBlocks/EmailNotificationInfoNotice";

interface DeleteFIDO2PasskeyConfirmProps {
  passkeyNickname?: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteFIDO2PasskeyConfirm({
  passkeyNickname,
  onConfirm,
  onCancel,
}: DeleteFIDO2PasskeyConfirmProps) {
  const { language } = useParams();
  const { t } = useTranslation("fido2");

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("DeleteFIDO2PasskeyConfirm.title")}
        </GcdsHeading>
        <GcdsText>
          {t("DeleteFIDO2PasskeyConfirm.noLongerUse")}{" "}
          <strong>{passkeyNickname}</strong>{" "}
          {t("DeleteFIDO2PasskeyConfirm.toSignIn")}
        </GcdsText>
        <EmailNotificationInfoNotice
          title={t("DeleteFIDO2PasskeyConfirm.infoTitle")}
          description={t("DeleteFIDO2PasskeyConfirm.infoDescription")}
          lang={language}
        />
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            buttonRole="danger"
            onGcdsClick={async (ev) => {
              ev.preventDefault();
              await onConfirm();
            }}
          >
            {t("DeleteFIDO2PasskeyConfirm.confirmButton")}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {t("DeleteFIDO2PasskeyConfirm.cancelButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
