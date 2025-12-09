import React from "react";
import { useParams } from "react-router";

import {
  GcdsContainer,
  GcdsHeading,
  GcdsText,
  GcdsButton,
  GcdsGrid,
  GcdsRadios,
  GcdsErrorMessage,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../../utils/functions.jsx";

import { PAGES, PROFILE_LANGUAGES } from "../../../utils/constants.jsx";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection.jsx";

export default function EditLanguagePreferences({
  languageFormData,
  onLanguageFormChange,
  onNext,
  onCancel,
  errorMessage,
  setErrorCode,
}) {
  const { language } = useParams();

  const pageContentJson = getPageContent(
    language,
    PAGES.editLanguagePreferences,
  );

  const englistSelection = {
    label: pageContentJson["13"],
    id: PROFILE_LANGUAGES.en,
    value: PROFILE_LANGUAGES.en,
    checked: languageFormData.updatedPreferredLanguage === PROFILE_LANGUAGES.en,
  };
  const frenchSelection = {
    label: pageContentJson["14"],
    id: PROFILE_LANGUAGES.fr,
    value: PROFILE_LANGUAGES.fr,
    checked: languageFormData.updatedPreferredLanguage === PROFILE_LANGUAGES.fr,
  };

  const languageOptions = [englistSelection, frenchSelection];

  const handleProfileChange = (e) => {
    const { value } = e.target;
    onLanguageFormChange(value);
    // Clear error when user makes selection
    if (setErrorCode) {
      setErrorCode("");
    }
  };

  const onSubmitHandler = (event) => {
    event.preventDefault();
    onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage && (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      )}

      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>{pageContentJson["2"]}</GcdsText>

      <GcdsGrid columns="1fr">
        <ServicesWithAccessInfoSection
          currentLang={language}
          information={"languagePreference"}
        />
      </GcdsGrid>

      <form id="form" style={{ marginTop: "38px" }} onSubmit={onSubmitHandler}>
        <GcdsContainer marginTop="100">
          <GcdsRadios
            name="radio"
            legend={pageContentJson["3"]}
            options={languageOptions}
            lang={language}
            onChange={handleProfileChange}
          />
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onSubmitHandler(ev);
            }}
          >
            {pageContentJson["15"]}
          </GcdsButton>

          <GcdsButton
            buttonRole="secondary"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              onCancel();
            }}
          >
            {pageContentJson["16"]}
          </GcdsButton>
        </GcdsGrid>
      </form>
    </GcdsContainer>
  );
}
