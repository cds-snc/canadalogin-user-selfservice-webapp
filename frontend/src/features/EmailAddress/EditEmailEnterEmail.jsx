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

export default function EditEmailEnterEmail({ onCancel }) {
  const { language } = useParams();
  const pageContentJson = getPageContent(language, PAGES.editEmailEnterEmail);
  const { cancel } = getPageContent(language, "Button");
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

      <GcdsInput
        style={{ marginTop: "1.5rem" }}
        label={pageContentJson["6"]}
        id="email"
        name="email"
        type="email"
      />

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton />
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
