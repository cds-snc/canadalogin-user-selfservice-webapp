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

import { getPageContent } from "../../../utils/functions";

import {
  PAGES,
  PROFILE_LANGUAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";

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
          information={
            ServicesWithAccessInfoSectionInformation.LANGUAGE_PREFERENCE
          }
        />
      </GcdsGrid>

      <form onSubmit={onSubmitHandler}>
        <GcdsContainer marginTop="100">
          <GcdsRadios
            name="radio"
            legend={pageContentJson["3"]}
            options={languageOptions}
            lang={language}
            onChange={handleProfileChange}
          />
        </GcdsContainer>
      </form>

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
