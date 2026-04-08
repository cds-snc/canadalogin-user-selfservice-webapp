import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { LANGUAGE_DISPLAY_NAMES } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { LanguagePreferenceConfirmProps } from "../../../types/languagePreference";

export default function ConfirmUpdate({
  languageFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}: LanguagePreferenceConfirmProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const { t } = useTranslation("language");

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

      <GcdsHeading tag="h1">{t("ConfirmLanguageUpdate.title")}</GcdsHeading>
      <GcdsText>
        {t("ConfirmLanguageUpdate.requestedUpdate")}{" "}
        <strong>{displayLanguageName}</strong>.
      </GcdsText>
      <GcdsText>{t("ConfirmLanguageUpdate.allServicesNotice")}</GcdsText>

      <GcdsGrid columns="max-content max-content" gap="200">
        <SubmitButton
          onGcdsClick={onSubmitHandler}
          disabled={localLoading}
          currentLang={routeLanguage}
        >
          {t("ConfirmLanguageUpdate.confirmButton")}
        </SubmitButton>
        <GcdsButton
          buttonRole="secondary"
          onGcdsClick={(event: Event) => {
            event.preventDefault();
            void onCancel();
          }}
        >
          {t("ConfirmLanguageUpdate.cancelButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
