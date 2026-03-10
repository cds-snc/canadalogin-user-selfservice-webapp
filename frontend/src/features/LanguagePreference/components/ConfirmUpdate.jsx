import React from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../../utils/functions";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

export default function ConfirmUpdate({
  languageFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}) {
  const { language } = useParams();

  const pageContentJson = getPageContent(language, PAGES.confirmLanguageUpdate);

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onConfirm();
  };

  if (!languageFormData?.languageCode) return null;

  return (
    <GcdsContainer role="main">
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}

      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]}{" "}
        <strong>
          {
            LANGUAGE_DISPLAY_NAMES[language][
              languageFormData.updatedPreferredLanguage
            ]
          }
        </strong>
        .
      </GcdsText>
      <GcdsText>{pageContentJson["4"]}</GcdsText>
      <ul>
        <li>
          <RPNameDisplay rpName={pageContentJson["5"]} />
        </li>
      </ul>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          onGcdsClick={onSubmitHandler}
          disabled={localLoading}
          currentLang={language}
        >
          {pageContentJson["8"]}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            onCancel();
          }}
        >
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
