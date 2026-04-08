import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";

import Loader from "../../../components/Layout/Loading";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { ProfileNameConfirmProps } from "../../../types/profileName";

function ErrorMessage({ errorMessage }: { errorMessage?: string }) {
  return errorMessage ? (
    <GcdsErrorMessage messageId="message-props">
      {errorMessage}
    </GcdsErrorMessage>
  ) : null;
}

export default function ConfirmUpdate({
  nameFormData,
  onConfirm,
  onCancel,
  errorMessage,
  localLoading,
}: ProfileNameConfirmProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";

  const { t } = useTranslation(["profile", "security"]);

  const formattedName = nameFormData?.formatted;

  const onSubmitHandler = (event: Event | CustomEvent<string | void>) => {
    event.preventDefault();
    void onConfirm();
  };

  if (!formattedName) {
    return null;
  }

  return localLoading ? (
    <Loader text={t("OtpSelection.loading", { ns: "security" })} />
  ) : (
    <>
      <ErrorMessage errorMessage={errorMessage} />
      <GcdsContainer role="main">
        <GcdsGrid columns="1" gap="300">
          <GcdsHeading tag="h1">
            {t("ProfileUpdateNameConfirmUpdate.title")}
          </GcdsHeading>
          <div>
            <GcdsText marginBottom="400">
              {t("ProfileUpdateNameConfirmUpdate.requestedUpdate")}{" "}
              <strong>{formattedName}</strong>.
            </GcdsText>
            <GcdsText marginBottom="0">
              {t("ProfileUpdateNameConfirmUpdate.allServicesNotice")}
            </GcdsText>
          </div>

          <GcdsNotice noticeRole="info" noticeTitleTag="h2" noticeTitle=" ">
            <GcdsText>
              {t("ProfileUpdateNameConfirmUpdate.thisText")}{" "}
              <strong>{t("ProfileUpdateNameConfirmUpdate.doesNot")}</strong>{" "}
              {t("ProfileUpdateNameConfirmUpdate.legallyChangeName")}
            </GcdsText>
          </GcdsNotice>
          <GcdsGrid columns="max-content max-content" gap="200">
            <SubmitButton
              onGcdsClick={onSubmitHandler}
              currentLang={routeLanguage}
            >
              {t("ProfileUpdateNameConfirmUpdate.confirmButton")}
            </SubmitButton>
            <GcdsButton
              buttonRole="secondary"
              onGcdsClick={(event: Event) => {
                event.preventDefault();
                void onCancel();
              }}
            >
              {t("ProfileUpdateNameConfirmUpdate.cancelButton")}
            </GcdsButton>
          </GcdsGrid>
        </GcdsGrid>
      </GcdsContainer>
    </>
  );
}
