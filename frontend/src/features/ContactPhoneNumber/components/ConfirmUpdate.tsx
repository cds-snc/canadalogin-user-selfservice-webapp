import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsErrorMessage,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import SubmitButton from "../../../components/Layout/SubmitButton";
import { path } from "../../../utils/routeHelpers";
import { PAGES } from "../../../utils/constants";
import { trackButtonClick } from "../../../utils/gatag";
import type { ContactPhoneConfirmUpdateProps } from "../../../types/contactPhoneNumber";

export default function ConfirmUpdate({
  onNext,
  phoneFormData,
  onCancel,
  errorMessage,
  setErrorCode,
  localLoading,
}: ContactPhoneConfirmUpdateProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation("phone");

  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    if (setErrorCode) {
      setErrorCode("");
    }

    trackButtonClick("confirm_phone_update", {
      form_id: "contact_phone_number_update",
      step: "confirmUpdate",
    });

    void onNext();
  };

  return (
    <GcdsContainer role="main">
      {errorMessage ? (
        <GcdsErrorMessage messageId="message-props">
          {errorMessage}
        </GcdsErrorMessage>
      ) : null}
      <GcdsGrid columns="1" gap="300">
        <GcdsHeading tag="h1" lang={language}>
          {t("ConfirmContactPhoneNumberUpdate.title")}
        </GcdsHeading>
        <div>
          <GcdsText marginBottom="0">
            {t("ConfirmContactPhoneNumberUpdate.requestedUpdate")}
          </GcdsText>
          <GcdsText marginTop="0">
            <strong>{phoneFormData.formattedPhoneNumber}</strong>
          </GcdsText>
        </div>

        <GcdsText>
          {t("ConfirmContactPhoneNumberUpdate.allServicesNotice")}
        </GcdsText>

        <GcdsNotice noticeRole="info" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            {t("ConfirmContactPhoneNumberUpdate.onlyChanges")}{" "}
            <strong>
              {t("ConfirmContactPhoneNumberUpdate.contactPhoneNumber")}
            </strong>
            <GcdsText>
              {t("ConfirmContactPhoneNumberUpdate.changeTwoStep")}{" "}
              <GcdsLink href={manage2FAVerificationsPage}>
                {t("ConfirmContactPhoneNumberUpdate.securitySettings")}
              </GcdsLink>
            </GcdsText>
          </GcdsText>
        </GcdsNotice>
        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            disabled={localLoading}
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitClick}
            currentLang={language}
          >
            {t("ConfirmContactPhoneNumberUpdate.confirmButton")}
          </SubmitButton>
          <GcdsButton
            buttonRole="secondary"
            disabled={localLoading}
            onGcdsClick={(event: Event) => {
              event.preventDefault();

              trackButtonClick("cancel_phone_confirmation", {
                form_id: "contact_phone_number_update",
                step: "confirmUpdate",
              });

              void onCancel();
            }}
          >
            {t("ConfirmContactPhoneNumberUpdate.cancelButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
