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
import RPNameDisplay from "../../components/RPInfo/RPNameDisplay";
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

  const pageContentJson =
    getPageContent(language, PAGES.emailConfirmUpdate) ?? {};
  const { cancel } = getPageContent(language, "Button") ?? {};

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
          <RPNameDisplay rpName={pageContentJson["4"] ?? ""} />
        </li>
      </ul>
      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          currentLang={language ?? "en"}
          onClick={() => void onSubmit()}
        >
          {pageContentJson["5"]}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          style={{ width: "fit-content" }}
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
