import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions";
import {
  PAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsInput,
  GcdsText,
} from "@cdssnc/gcds-components-react";
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
  const pageContentJson = getPageContent(language, PAGES.editEmailEnterEmail)!;
  const { cancel } = getPageContent(language, "Button")!;

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
      <GcdsHeading tag="h1" lang={language}>
        {pageContentJson["1"]}
      </GcdsHeading>

      <GcdsContainer>
        <GcdsText marginBottom="0">{pageContentJson["2"]}</GcdsText>
        <ul>
          <li>
            <GcdsText marginBottom="0">{pageContentJson["3"]}</GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">{pageContentJson["4"]}</GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">{pageContentJson["5"]}</GcdsText>
          </li>
        </ul>
      </GcdsContainer>

      <ServicesWithAccessInfoSection
        currentLang={language ?? "en"}
        information={ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS}
      />
      <form onSubmit={onSubmitHandler}>
        <GcdsInput
          style={{ marginTop: "1.5rem" }}
          label={pageContentJson["6"]}
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
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language ?? "en"}
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void onSubmit(formData?.emailAddress || "");
          }}
        />
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            void onCancel();
          }}
        >
          {cancel}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
