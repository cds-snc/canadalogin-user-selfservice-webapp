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
import { EXTERNAL_NAVIGATION_LINKS } from "../../../utils/constants";
import SubmitButton from "../../../components/Layout/SubmitButton";
import type { ContactPhoneSuccessProps } from "../../../types/contactPhoneNumber";

export default function SuccessfullyUpdated({
  onNext,
  onCancel,
  phoneFormData,
}: ContactPhoneSuccessProps) {
  const { language = "en" } = useParams<{ language: string }>();
  const { t } = useTranslation("phone");

  const onSubmitClick = (event: CustomEvent<string | void>) => {
    event.preventDefault();
    void onNext();
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1">
        <GcdsNotice noticeRole="success" noticeTitleTag="h2" noticeTitle=" ">
          <GcdsText>
            <strong>
              {t("SuccessfullyUpdatedContactPhoneNumber.phoneUpdatedTo")}{" "}
              {phoneFormData?.formattedPhoneNumber || ""}
            </strong>
          </GcdsText>
        </GcdsNotice>
        <GcdsHeading marginBottom="150" tag="h1">
          {t("SuccessfullyUpdatedContactPhoneNumber.updateOtherPlaces")}
        </GcdsHeading>

        <GcdsHeading marginTop="0" marginBottom="0" tag="h3">
          {t("SuccessfullyUpdatedContactPhoneNumber.onlyConnectedServices")}
        </GcdsHeading>

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
        <GcdsGrid columns="max-content max-content" gap="200">
          <SubmitButton
            style={{ width: "fit-content" }}
            onGcdsClick={onSubmitClick}
            currentLang={language}
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
