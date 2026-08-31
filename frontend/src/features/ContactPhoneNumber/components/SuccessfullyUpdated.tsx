import { useParams } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import parsePhoneNumberFromString from "libphonenumber-js";
import { EXTERNAL_NAVIGATION_LINKS } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { ContactPhoneSuccessProps } from "../../../types/contactPhoneNumber";

export default function SuccessfullyUpdated({
  onNext,
  onCancel,
  phoneFormData,
}: ContactPhoneSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const routeLanguage = language === "fr" ? "fr" : "en";
  const { t } = useTranslation("phone");

  const displayPhoneNumber = (() => {
    const fallbackNumber =
      phoneFormData?.formattedPhoneNumber || phoneFormData?.phoneNumber || "";
    const sourceNumber = phoneFormData?.phoneNumber || fallbackNumber;

    if (!sourceNumber) {
      return "";
    }

    try {
      const parsedPhoneNumber = parsePhoneNumberFromString(sourceNumber);

      if (parsedPhoneNumber) {
        if (parsedPhoneNumber.countryCallingCode === "1") {
          return `+1 ${parsedPhoneNumber.formatNational()}`;
        }

        return parsedPhoneNumber.formatInternational();
      }
    } catch {
      // Fall back to previously captured formatted value.
    }

    return fallbackNumber;
  })();

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="300">
        <GcdsNotice
          noticeRole="success"
          noticeTitleTag="h2"
          noticeTitle={t("SuccessfullyUpdatedContactPhoneNumber.successTitle")}
        >
          <GcdsText>
            {t("SuccessfullyUpdatedContactPhoneNumber.phoneUpdatedTo")}{" "}
            <strong>{displayPhoneNumber}</strong>.
          </GcdsText>
        </GcdsNotice>

        <GcdsHeading marginBottom="150" tag="h1">
          {t("SuccessfullyUpdatedContactPhoneNumber.updateOtherPlaces")}
        </GcdsHeading>

        <GcdsText marginTop="0" marginBottom="0">
          <strong>
            {t("SuccessfullyUpdatedContactPhoneNumber.onlyConnectedServices")}
          </strong>
        </GcdsText>

        <GcdsText>
          {t("SuccessfullyUpdatedContactPhoneNumber.notConnectedNotice")}
        </GcdsText>
        <GcdsText>
          {t("SuccessfullyUpdatedContactPhoneNumber.searchOtherAccounts")}{" "}
          <GcdsLink
            href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
            target="_blank"
          >
            {t("SuccessfullyUpdatedContactPhoneNumber.gcAccountDirectory")}
          </GcdsLink>
        </GcdsText>

        <GcdsNotice
          noticeRole="warning"
          noticeTitleTag="h2"
          noticeTitle={t(
            "SuccessfullyUpdatedContactPhoneNumber.syncNoticeTitle",
          )}
        >
          <GcdsText>
            {t("SuccessfullyUpdatedContactPhoneNumber.syncNoticeDescription")}
          </GcdsText>
          <GcdsText>
            {t("SuccessfullyUpdatedContactPhoneNumber.servicesLinkLead")}{" "}
            <GcdsLink
              href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
              target="_blank"
            >
              {t("SuccessfullyUpdatedContactPhoneNumber.servicesLinkText")}
            </GcdsLink>{" "}
            {t("SuccessfullyUpdatedContactPhoneNumber.servicesLinkSuffix")}
          </GcdsText>
        </GcdsNotice>

        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitClick}
            currentLang={routeLanguage}
          >
            {t("SuccessfullyUpdatedContactPhoneNumber.backToProfile")}
          </SubmitButton>

          <GcdsButton
            buttonRole="secondary"
            style={{ width: "fit-content" }}
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              void onCancel();
            }}
          >
            {t("SuccessfullyUpdatedContactPhoneNumber.signOut")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
