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
import { useEnterKeySubmit } from "../../../utils/enterKeyHandler.jsx";
import SubmitButton from "../../../components/Layout/SubmitButton.jsx";

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

  const onSubmitHandler = async (ev) => {
    ev.preventDefault();
    await onNext();
  };

  const handleKeyDown = useEnterKeySubmit(onSubmitHandler);

  return (
    <GcdsContainer role="main" onKeyDown={handleKeyDown}>
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
        <SubmitButton onGcdsClick={onSubmitHandler} currentLang={language}>
          {pageContentJson["15"]}
        </SubmitButton>

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
    </GcdsContainer>
  );
}
