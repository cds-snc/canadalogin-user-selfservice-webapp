import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
} from "@gcds-core/components-react";

import { useTranslation } from "react-i18next";
import { DEV_ONLY_FEATURE } from "../../utils/constants";
import { useUser } from "../Providers/useUser";
import VerifiedBadge from "../Badges/VerifiedBadge";
import ViewContactPhoneNumber from "../../features/ContactPhoneNumber/components/ViewContactPhoneNumber";
import ViewNameCard from "../../features/ProfileName/components/ViewProfileNameCard";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference";
import ProvenInformationCard from "../../features/IDV/ProvenInformationCard";
import ViewEmailInfo from "../../features/ProfileName/components/ViewEmailInfo";
import CompleteIdentityProofingNotice from "../../features/IDV/components/CompleteIdentityProofingNotice";
import IdentityInfoSuccessNotice from "../../features/IDV/IdentityInfoSuccessNotice";

type ProfileHomeProps = {
  showIDVSuccessNotice?: boolean;
};

export default function ProfileHome({
  showIDVSuccessNotice = false,
}: ProfileHomeProps) {
  const { t } = useTranslation("profile");
  const { state } = useUser();
  const phoneNumbers = state?.userProfile?.phoneNumbers || [];

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1 auto" gap="300">
        <GcdsHeading tag="h1" marginTop="0">
          {t("ProfileHome.title")}
        </GcdsHeading>
        {DEV_ONLY_FEATURE && (
          <IdentityInfoSuccessNotice
            showIDVSuccessNotice={showIDVSuccessNotice}
          />
        )}
        {DEV_ONLY_FEATURE && (
          <GcdsContainer className="idvNoticeSpacing">
            <CompleteIdentityProofingNotice />
          </GcdsContainer>
        )}
        {DEV_ONLY_FEATURE && (
          <GcdsContainer>
            <GcdsGrid columns="1fr auto" className="gridInline">
              <GcdsHeading tag="h2" marginTop="0">
                {t("ProfileHome.provenInformation")}
              </GcdsHeading>
              <VerifiedBadge text={"Proven January 27, 2026"} />
            </GcdsGrid>

            <ProvenInformationCard />
          </GcdsContainer>
        )}
        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.basicInfo")}
          </GcdsHeading>
          <ViewNameCard />
        </GcdsContainer>
        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.contactInfo")}
          </GcdsHeading>

          <GcdsContainer className="sectionCard">
            <ViewEmailInfo />
            <div className="separator" />
            <ViewContactPhoneNumber phoneNumbers={phoneNumbers} />
          </GcdsContainer>
        </GcdsContainer>
        <GcdsContainer>
          {" "}
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.communication")}
          </GcdsHeading>
          <GcdsContainer className="sectionCard">
            <ViewLanguagePreferences />
            <div className="separator" />
            <GcdsHeading tag="h3" marginTop="300">
              {t("ProfileHome.notifications")}
            </GcdsHeading>
            <GcdsText>{t("ProfileHome.notificationDescription")}</GcdsText>
            <GcdsText>{t("ProfileHome.serviceNotifications")}</GcdsText>
          </GcdsContainer>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
