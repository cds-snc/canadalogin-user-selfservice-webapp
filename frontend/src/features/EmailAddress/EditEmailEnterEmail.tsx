import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { ServicesWithAccessInfoSectionInformation } from "../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@gcds-core/components-react";
import ServicesWithAccessInfoSection from "../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../components/Layout/SubmitButton";

type EmailFormData = {
  emailAddress: string;
};

interface EditEmailEnterEmailProps {
  onSubmit: (emailAddress: string) => Promise<void>;
  onCancel: () => void | Promise<void>;
  handleFormChange: (ev: CustomEvent<string>) => void;
  formData: EmailFormData;
  errorMessage?: string;
  setErrorCode: (errorCode: string) => void;
}

export default function EditEmailEnterEmail({
  onSubmit,
  onCancel,
  handleFormChange,
  formData,
  errorMessage,
  setErrorCode,
}: EditEmailEnterEmailProps) {
  const { language } = useParams();
  const { t } = useTranslation(["email", "common"]);

  const onSubmitHandler: React.FormEventHandler<HTMLFormElement> = async (
    ev,
  ) => {
    ev.preventDefault();
    await onSubmit(formData?.emailAddress || "");
  };

  const handleInputChange = (ev: CustomEvent<string>) => {
    setErrorCode(""); // Clear any existing errors
    handleFormChange(ev);
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("EditEmailEnterEmail.title")}
        </GcdsHeading>

        <GcdsContainer>
          <GcdsText marginBottom="0">
            {t("EditEmailEnterEmail.changingAffects")}
          </GcdsText>
          <ul>
            <li>
              <GcdsText marginBottom="0">
                {t("EditEmailEnterEmail.signInEmail")}
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("EditEmailEnterEmail.contactEmail")}
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("EditEmailEnterEmail.serviceEmail")}
              </GcdsText>
            </li>
          </ul>
        </GcdsContainer>

        <ServicesWithAccessInfoSection
          currentLang={language ?? "en"}
          information={ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS}
        />

        <form onSubmit={onSubmitHandler}>
          <GcdsGrid columns="1" gap="300">
            <GcdsInput
              label={t("EditEmailEnterEmail.emailLabel")}
              inputId="emailAddress"
              name="emailAddress"
              type="email"
              value={formData?.emailAddress || ""}
              errorMessage={errorMessage}
              validateOn="other"
              onGcdsInput={handleInputChange}
              required
              autoFocus
            />

            <GcdsGrid columns="max-content max-content" gap="200">
              <SubmitButton currentLang={language ?? "en"} />
              <GcdsButton
                buttonRole="secondary"
                onGcdsClick={(ev) => {
                  ev.preventDefault();
                  void onCancel();
                }}
              >
                {t("Button.cancel", { ns: "common" })}
              </GcdsButton>
            </GcdsGrid>
          </GcdsGrid>
        </form>
      </GcdsGrid>
    </GcdsContainer>
  );
}
