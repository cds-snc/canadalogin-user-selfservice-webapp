import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
} from "@gcds-core/components-react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router";

import { useTranslation } from "react-i18next";
import { useUser } from "../Providers/useUser";
import { useIdvFeatureAccess } from "../../hooks/useIdvFeatureAccess";
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
  const idvFeatureEnabled = useIdvFeatureAccess();
  const phoneNumbers = state?.userProfile?.phoneNumbers || [];
  const [identityVerificationClaims, setIdentityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();
  const showIDVSuccessNotice = Boolean(
    (location.state as ProfileHomeLocationState | null)?.showIDVSuccessNotice,
  );

  useEffect(() => {
    if (!idvFeatureEnabled) {
      return;
    }

    void identityVerificationApi
      .getClaims()
      .then(setIdentityVerificationClaims)
      .catch(() => undefined);
  }, [idvFeatureEnabled]);

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
        {idvFeatureEnabled && (
          <IdentityInfoSuccessNotice
            showIDVSuccessNotice={showIDVSuccessNotice}
          />
        )}
        {idvFeatureEnabled && !showIDVSuccessNotice && !verifiedClaims && (
          <GcdsContainer className="idvNoticeSpacing">
            <CompleteIdentityProofingNotice />
          </GcdsContainer>
        )}
        {idvFeatureEnabled && verifiedClaims && (
          <GcdsContainer>
            <GcdsGrid columns="1fr auto" className="gridInline">
              <GcdsHeading tag="h2" marginTop="0">
                {t("ProfileHome.provenInformation")}
              </GcdsHeading>
              {provenDate && (
                <VerifiedBadge
                  text={`${t("ProfileHome.verifiedOn")} ${provenDate}`}
                />
              )}
            </GcdsGrid>

            <ProvenInformationCard claims={verifiedClaims} />
          </GcdsContainer>
        )}
        <GcdsContainer>
          <GcdsHeading tag="h2" marginTop="0">
            {t("ProfileHome.contactInfo")}
          </GcdsHeading>

          <GcdsContainer className="sectionCard">
            <ViewNameCard />
            <div className="separator" />
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
