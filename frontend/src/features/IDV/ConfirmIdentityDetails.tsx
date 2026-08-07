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
import ProvenInformationCard from "../IDV/ProvenInformationCard";
import { identityVerificationApi } from "./api/identityVerificationApi";
import VerifiedBadge from "../../components/Badges/VerifiedBadge";
import { path } from "../../utils/routeHelpers";

export default function ConfirmIdentityDetails() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const { language, journeyType } = useParams();
  const { relyingPartyUrl, relyingPartyName, hasRelyingParty } =
    useRelyingPartyInfo();

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

          <GcdsHeading tag="h2" marginTop="0" marginBottom="0">
            {t("ConfirmIdentityDetails.identityProofingDetails")}
          </GcdsHeading>

          <GcdsText marginBottom="300">
            <VerifiedBadge text={t("ConfirmIdentityDetails.verifiedBadgeText")} />
          </GcdsText>

          <ProvenInformationCard />

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
