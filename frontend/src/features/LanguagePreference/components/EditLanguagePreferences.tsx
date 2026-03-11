import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsRadios,
  GcdsText,
} from "@cdssnc/gcds-components-react";

import { getPageContent } from "../../../utils/functions";
import {
  PAGES,
  PROFILE_LANGUAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  LanguagePreferenceEditProps,
  LanguagePreferencePageContent,
} from "../../../types/languagePreference";

export default function EditLanguagePreferences({
  languageFormData,
  onLanguageFormChange,
  onNext,
  onCancel,
  errorMessage,
  setErrorCode,
}: LanguagePreferenceEditProps) {
  const { language = "en" } = useParams<{ language: string }>();

  const pageContentJson =
    (getPageContent(language, PAGES.editLanguagePreferences) as
      | LanguagePreferencePageContent
      | undefined) ?? {};

  const englishSelection = {
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

  const languageOptions = [englishSelection, frenchSelection];

  const applyLanguageSelection = (value?: string) => {
    if (!value) {
      return;
    }

    onLanguageFormChange(value);
    if (setErrorCode) {
      setErrorCode("");
    }
  };

  const handleProfileChange = (event: Event) => {
    const target = event.target as HTMLInputElement | null;
    applyLanguageSelection(target?.value);
  };

  const onSubmitHandler = (event: Event | React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage ? (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      ) : null}

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
        <GcdsContainer style={{ marginTop: "1rem" }}>
          <GcdsRadios
            name="radio"
            legend={pageContentJson["3"]}
            options={languageOptions}
            lang={language}
            onChange={(event) => {
              const target = event.target as HTMLInputElement | null;
              applyLanguageSelection(target?.value);
            }}
            onGcdsChange={handleProfileChange}
          />
        </GcdsContainer>
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton onGcdsClick={onSubmitHandler} currentLang={language}>
          {pageContentJson["15"]}
        </SubmitButton>

        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            void onCancel();
          }}
        >
          {pageContentJson["16"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
