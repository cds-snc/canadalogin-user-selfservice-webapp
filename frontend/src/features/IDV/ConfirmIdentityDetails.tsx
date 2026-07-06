import { useNavigate } from "react-router";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE } from "../../utils/constants";
import { useUser } from "../../components/Providers/useUser";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference";
import ProvenInformationCard from "../IDV/ProvenInformationCard";
import ViewProfileNameCard from "../ProfileName/components/ViewProfileNameCard";
import ViewContactPhoneNumber from "../ContactPhoneNumber/components/ViewContactPhoneNumber";
import DisplayEmailInfo from "../ProfileName/components/ViewEmailInfo";

export default function ConfirmIdentityDetails() {
  const { t } = useTranslation("idv");

  const { t: tLayout } = useTranslation("layout");

  const navigate = useNavigate();
  const { state } = useUser();

  const phoneNumbers = state?.userProfile?.phoneNumbers || [];

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">

        <GcdsContainer>
          <GcdsNotice
            noticeRole="success"
            noticeTitleTag="h2"
            noticeTitle={t("ConfirmIdentityDetails.successNoticeTitle")}
          >
            <GcdsText>
              {t("ConfirmIdentityDetails.successNoticeDescription", {
                appName: tLayout("TopNavBar.appName"),
              })}
            </GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("ConfirmIdentityDetails.pageTitle")}
          </GcdsHeading>
          <GcdsText>{t("ConfirmIdentityDetails.description")}</GcdsText>
        </GcdsContainer>

        <ProvenInformationCard />

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ConfirmIdentityDetails.contactInfo")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <ViewProfileNameCard isConfirmIdentityDetails />
            <div className="separator" />
            <DisplayEmailInfo />
            <div className="separator" />
            <ViewContactPhoneNumber phoneNumbers={phoneNumbers} />
          </GcdsContainer>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ConfirmIdentityDetails.communication")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <ViewLanguagePreferences />
          </GcdsContainer>
        </GcdsContainer>

        <GcdsButton
          type="button"
          onGcdsClick={(event) => {
            event.preventDefault();
            // TODO: Replace with final post-confirmation destination.
            navigate("");
          }}
        >
          {t("ConfirmIdentityDetails.confirmAndContinue")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
