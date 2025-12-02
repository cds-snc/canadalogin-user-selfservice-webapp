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

import { getPageContent } from "../../../utils/functions.jsx";
import { PAGES, LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants.jsx";

export default function ConfirmUpdate({
  languageFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}) {
  const { language } = useParams();

  if (!languageFormData?.languageCode) return null;

  const pageContentJson = getPageContent(language, PAGES.confirmLanguageUpdate);

  return (
    <GcdsContainer>
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
        <li>{pageContentJson["5"]}</li>
      </ul>

      <GcdsGrid columns="max-content max-content" gap="200">
        <GcdsButton
          onGcdsClick={async (ev) => {
            ev.preventDefault();
            await onConfirm();
          }}
          disabled={localLoading}
        >
          {pageContentJson["8"]}
        </GcdsButton>
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
