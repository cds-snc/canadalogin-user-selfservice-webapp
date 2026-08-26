import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import SubmitButton from "../../components/Layout/SubmitButton";

type EmailFormData = {
  emailAddress: string;
};

interface EmailConfirmUpdateProps {
  formData: EmailFormData;
  onSubmit: () => Promise<void>;
  onCancel: () => void | Promise<void>;
}

export default function EmailConfirmUpdate({
  formData,
  onSubmit,
  onCancel,
}: EmailConfirmUpdateProps) {
  const { language = "en" } = useParams<{ language?: string }>();
  const { t } = useTranslation(["email", "common"]);

  if (!formData?.emailAddress) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1" lang={language}>
        {t("EmailConfirmUpdate.title")}
      </GcdsHeading>

      <GcdsText>
        {t("EmailConfirmUpdate.requestedUpdate")}{" "}
        <strong>{formData.emailAddress}</strong>
      </GcdsText>

      <GcdsNotice
        noticeRole="warning"
        noticeTitleTag="h2"
        noticeTitle={t("EmailConfirmUpdate.warningTitle")}
        lang={language}
      >
        <GcdsText marginBottom="200">
          {t("EmailConfirmUpdate.warningIntro")}
        </GcdsText>
        <ul style={{ margin: 0, paddingInlineStart: "1.5rem" }}>
          <li>{t("EmailConfirmUpdate.warningBullet1")}</li>
          <li>{t("EmailConfirmUpdate.warningBullet2")}</li>
        </ul>
      </GcdsNotice>

      <GcdsGrid columns="max-content max-content" gap="200" marginTop="300">
        <SubmitButton currentLang={language} onClick={() => void onSubmit()}>
          {t("EmailConfirmUpdate.confirmButton")}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void onCancel();
          }}
        >
          {t("Button.cancel", { ns: "common" })}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
