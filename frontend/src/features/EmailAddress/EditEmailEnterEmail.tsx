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
import { ChangeEvent, FormEvent } from "react";

type EditEmailEnterEmailProps = {
  onSubmit: (email: string) => Promise<void> | void;
  onCancel: () => void;
  formData: { emailAddress?: string };
  setFormData?: (f: { emailAddress?: string }) => void;
  // Legacy prop name used in some tests / callers
  handleFormChange?: (f: { emailAddress?: string }) => void;
  errorMessage?: string | null;
  setErrorCode?: (code: string | null) => void;
};

export default function EditEmailEnterEmail({
  onSubmit,
  onCancel,
  formData,
  setFormData,
  handleFormChange,
  errorMessage,
  setErrorCode,
}: EditEmailEnterEmailProps) {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.editEmailEnterEmail);
  const { cancel } = getPageContent(language, "Button");

  const onSubmitHandler = async (ev: FormEvent) => {
    ev.preventDefault();
    const emailAddress = formData?.emailAddress || "";
    await onSubmit(emailAddress);
  };

  const handleInputChange = (ev: ChangeEvent<HTMLInputElement>) => {
    if (setErrorCode) setErrorCode(""); // Clear any existing errors
    const value = (ev.target as HTMLInputElement).value;
    const setter = setFormData ?? handleFormChange;
    if (setter) setter({ emailAddress: value });
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
        currentLang={language}
        information={ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS}
      />
      <form onSubmit={onSubmitHandler}>
        <GcdsInput
          style={{ marginTop: "1.5rem" }}
          label={pageContentJson["6"]}
          id="emailAddress"
          name="emailAddress"
          type="email"
          value={formData?.emailAddress || ""}
          errorMessage={errorMessage}
          validateOn="other"
          onGcdsInput={handleInputChange}
          required
          autofocus
        />
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton onGcdsClick={onSubmitHandler} />
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {cancel}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
