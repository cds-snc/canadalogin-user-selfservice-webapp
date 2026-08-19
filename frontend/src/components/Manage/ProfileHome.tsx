import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
} from "@gcds-core/components-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

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
import IdentityInfoSuccessNotice from "../../features/IDV/components/IdentityInfoSuccessNotice";
import {
  identityVerificationApi,
  type IdentityVerificationClaimsResponse,
} from "../../features/IDV/api/identityVerificationApi";

type ProfileHomeLocationState = {
  showIDVSuccessNotice?: boolean;
};

export default function ProfileHome() {
  const location = useLocation();
  const { t, i18n } = useTranslation("profile");
  const { state } = useUser();
  const phoneNumbers = state?.userProfile?.phoneNumbers || [];
  const [identityVerificationClaims, setIdentityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();
  const showIDVSuccessNotice = Boolean(
    (location.state as ProfileHomeLocationState | null)?.showIDVSuccessNotice,
  );

  useEffect(() => {
    if (!DEV_ONLY_FEATURE) {
      return;
    }

    void identityVerificationApi
      .getClaims()
      .then(setIdentityVerificationClaims)
      .catch(() => undefined);
  }, []);

  const verifiedClaims =
    identityVerificationClaims?.status === "verified"
      ? identityVerificationClaims.verified_claims
      : undefined;
  const verificationTime = verifiedClaims?.verification?.time;
  const provenDate = verificationTime
    ? new Intl.DateTimeFormat(i18n.language, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(verificationTime))
    : undefined;

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
        {DEV_ONLY_FEATURE && !showIDVSuccessNotice && !verifiedClaims && (
          <GcdsContainer className="idvNoticeSpacing">
            <CompleteIdentityProofingNotice />
          </GcdsContainer>
        )}
        {DEV_ONLY_FEATURE && verifiedClaims && (
          <GcdsContainer>
            <GcdsGrid columns="1fr auto" className="gridInline">
              <GcdsHeading tag="h2" marginTop="0">
                {t("ProfileHome.provenInformation")}
              </GcdsHeading>
              {provenDate && (
                <VerifiedBadge
                  text={`${t("ProfileHome.verified")} ${provenDate}`}
                />
              )}
            </GcdsGrid>

            <ProvenInformationCard claims={verifiedClaims} />
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
