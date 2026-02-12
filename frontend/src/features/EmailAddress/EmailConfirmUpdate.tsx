import { useParams } from "react-router";
import { getPageContent } from "../../utils/functions";
import { PAGES } from "../../utils/constants";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@cdssnc/gcds-components-react";
import SubmitButton from "../../components/Layout/SubmitButton";
import RPNameDisplay from "../../components/RPInfo/RPNameDisplay";
import { FormEvent } from "react";

type EmailConfirmUpdateProps = {
  onSubmit: () => Promise<void> | void;
  onCancel: () => void;
  formData: { emailAddress?: string };
  setFormData?: (f: { emailAddress?: string }) => void;
  errorMessage?: string | null;
};

export default function EmailConfirmUpdate({
  onSubmit,
  onCancel,
  formData,
}: EmailConfirmUpdateProps) {
  const { language } = useParams();

  const pageContentJson = getPageContent(language, PAGES.emailConfirmUpdate);
  const { cancel } = getPageContent(language, "Button");

  const onSubmitHandler = async (ev: FormEvent) => {
    ev.preventDefault();
    await onSubmit();
  };

  if (!formData?.emailAddress) return null;

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]} <strong>{formData.emailAddress}</strong>.
      </GcdsText>
      <GcdsText>{pageContentJson["3"]}</GcdsText>
      <ul>
        <li>
          <RPNameDisplay rpName={pageContentJson["4"]} />
        </li>
      </ul>
      <GcdsGrid columns="max-content max-content" gap="200" marginTop="400">
        <SubmitButton
          type="submit"
          text={pageContentJson["5"]}
          onClick={onSubmitHandler}
        />
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
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
