import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { getPageContent } from "../../../utils/functions";
import { LANGUAGE_DISPLAY_NAMES, PAGES } from "../../../utils/constants";
import RPNameDisplay from "../../../components/RPInfo/RPNameDisplay";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type {
  LanguagePreferenceConfirmProps,
  LanguagePreferencePageContent,
} from "../../../types/languagePreference";

export default function ConfirmUpdate({
  languageFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}: LanguagePreferenceConfirmProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const pageContentJson =
    (getPageContent(routeLanguage, PAGES.confirmLanguageUpdate) as
      | LanguagePreferencePageContent
      | undefined) ?? {};

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onConfirm();
  };

  if (!languageFormData?.languageCode) {
    return null;
  }

  const displayLanguageName =
    LANGUAGE_DISPLAY_NAMES[routeLanguage]?.[
      languageFormData.updatedPreferredLanguage as keyof (typeof LANGUAGE_DISPLAY_NAMES)["en"]
    ] || languageFormData.updatedPreferredLanguage;

  return (
    <GcdsContainer role="main">
      {errorMessage ? (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      ) : null}

      <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
      <GcdsText>
        {pageContentJson["2"]} <strong>{displayLanguageName}</strong>.
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
          currentLang={routeLanguage}
        >
          {pageContentJson["8"]}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            void onCancel();
          }}
        >
          {pageContentJson["9"]}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
