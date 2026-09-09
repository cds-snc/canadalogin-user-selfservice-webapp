import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { IDV_JOURNEY_TYPE } from "./constants";
import { useRelyingPartyInfo } from "../../hooks/useRelyingPartyInfo";
import ProvenInformationCard from "./ProvenInformationCard";
import { path } from "../../utils/routeHelpers";
import {
  identityVerificationApi,
  type IdentityVerificationClaimsResponse,
} from "../../features/IDV/api/identityVerificationApi";
import VerifiedBadge from "../../components/Badges/VerifiedBadge";

export default function ConfirmIdentityDetails() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(["idv", "profile"]);
  const { language, journeyType } = useParams();
  const { relyingPartyUrl, relyingPartyName, hasRelyingParty } =
    useRelyingPartyInfo();

  const [identityVerificationClaims, setIdentityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();

  useEffect(() => {
    if (!DEV_ONLY_FEATURE) {
      return;
    }

    void identityVerificationApi
      .getClaims()
      .then(setIdentityVerificationClaims)
      .catch(() => undefined);
  }, []);

  const fallbackRedirectUrl = relyingPartyUrl || "/";
  const backToProfilePage = path(PAGES.ProfileHome, { language });

  const successNoticeTitleKey = hasRelyingParty
    ? "ConfirmIdentityDetails.successNoticeTitle"
    : "ConfirmIdentityDetails.successNoticeTitleWithoutRp";
  const successNoticeDescriptionKey = hasRelyingParty
    ? "ConfirmIdentityDetails.successNoticeDescription"
    : "ConfirmIdentityDetails.successNoticeDescriptionWithoutRp";

  const redirectToRelyingParty = async () => {
    try {
      const response = await identityVerificationApi.getPostIdvRedirectUrl();
      window.location.assign(
        response?.data?.redirect_url || fallbackRedirectUrl,
      );
    } catch (error) {
      console.error("Unable to resolve post-IDV redirect URL:", error);
      window.location.assign(fallbackRedirectUrl);
    }
  };

  const handleContinue = async () => {
    switch (journeyType) {
      case IDV_JOURNEY_TYPE.REQUIRED:
        await redirectToRelyingParty();
        break;
      default:
        navigate(backToProfilePage, {
          state: { showIDVSuccessNotice: true },
        });
    }
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

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
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsNotice
            noticeRole="success"
            noticeTitleTag="h2"
            noticeTitle={t(successNoticeTitleKey)}
          >
            <GcdsText>
              {t(successNoticeDescriptionKey, { appName: relyingPartyName })}
            </GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("ConfirmIdentityDetails.pageTitle")}
          </GcdsHeading>

          <GcdsText>{t("ConfirmIdentityDetails.description")}</GcdsText>

          {DEV_ONLY_FEATURE && verifiedClaims && (
            <GcdsContainer>
              <GcdsGrid columns="1fr auto" className="gridInline">
                <GcdsHeading tag="h2" marginTop="0">
                  {t("profile:ProfileHome.provenInformation")}
                </GcdsHeading>
                {provenDate && (
                  <VerifiedBadge
                    text={`${t("profile:ProfileHome.verified")} ${provenDate}`}
                  />
                )}
              </GcdsGrid>
              <ProvenInformationCard claims={verifiedClaims} />
            </GcdsContainer>
          )}
          <GcdsButton
            type="button"
            onGcdsClick={(event) => {
              event.preventDefault();
              void handleContinue();
            }}
          >
            {t("ConfirmIdentityDetails.confirmAndContinue")}
          </GcdsButton>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
