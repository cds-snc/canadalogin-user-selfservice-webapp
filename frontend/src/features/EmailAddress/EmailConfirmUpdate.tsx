import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
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
  const { language } = useParams();
  const { t } = useTranslation(["email", "common"]);

  if (!formData?.emailAddress) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{t("EmailConfirmUpdate.title")}</GcdsHeading>
      <GcdsText>
        {t("EmailConfirmUpdate.requestedUpdate")}{" "}
        <strong>{formData.emailAddress}</strong>.
      </GcdsText>
      <GcdsText>{t("EmailConfirmUpdate.allServicesNotice")}</GcdsText>
      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language ?? "en"}
          onClick={() => void onSubmit()}
        >
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
