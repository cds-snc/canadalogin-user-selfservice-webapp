import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsRadios,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import {
  PROFILE_LANGUAGES,
  ServicesWithAccessInfoSectionInformation,
} from "../../../utils/constants";
import ServicesWithAccessInfoSection from "../../../components/InfoBlocks/ServicesWithAccessInfoSection";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { LanguagePreferenceEditProps } from "../../../types/languagePreference";

export default function EditLanguagePreferences({
  languageFormData,
  onLanguageFormChange,
  onNext,
  onCancel,
  errorMessage,
  setErrorCode,
}: LanguagePreferenceEditProps) {
  const { language = "en" } = useParams<{ language: string }>();

  const { t } = useTranslation("language");

  const englishSelection = {
    label: t("EditLanguagePreferences.english"),
    id: PROFILE_LANGUAGES.en,
    value: PROFILE_LANGUAGES.en,
    checked: languageFormData.updatedPreferredLanguage === PROFILE_LANGUAGES.en,
  };
  const frenchSelection = {
    label: t("EditLanguagePreferences.french"),
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

      <GcdsHeading tag="h1">{t("EditLanguagePreferences.title")}</GcdsHeading>
      <GcdsText>{t("EditLanguagePreferences.description")}</GcdsText>

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
            legend={t("EditLanguagePreferences.chooseLanguage")}
            options={languageOptions}
            lang={language}
            onChange={(event) => {
              const target = event.target as unknown as HTMLInputElement | null;
              applyLanguageSelection(target?.value);
            }}
            onGcdsChange={handleProfileChange}
          />
        </GcdsContainer>
      </form>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton onGcdsClick={onSubmitHandler} currentLang={language}>
          {t("EditLanguagePreferences.continueButton")}
        </SubmitButton>

        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            void onCancel();
          }}
        >
          {t("EditLanguagePreferences.cancelButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
