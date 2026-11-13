import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
  GcdsLink,
} from "@gcds-core/components-react";

import { DEV_ONLY_FEATURE, PAGES } from "../../utils/constants";
import { useRelyingPartyInfo } from "../../hooks/useRelyingPartyInfo";
import AccessibleNotice from "../../components/InfoBlocks/AccessibleNotice";
import DataInformationCard from "./components/DataInformationCard";
import { path } from "../../utils/routeHelpers";
import {
  identityVerificationApi,
  type IdentityVerificationClaimsResponse,
} from "../../features/IDV/api/identityVerificationApi";
import { mockIdentityClaims } from "../IDV/data/mockIdentityClaims";

export default function DataTransparencyPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const isMockProofing = DEV_ONLY_FEATURE && state?.mockProofing === true;
  const { t } = useTranslation("dataTransparency");
  const { language } = useParams();
  const { relyingPartyUrl, relyingPartyName, hasRelyingParty } =
    useRelyingPartyInfo();

  const [identityVerificationClaims, setIdentityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();

  useEffect(() => {
    if (!DEV_ONLY_FEATURE || isMockProofing) {
      return;
    }

    void identityVerificationApi
      .getClaims()
      .then(setIdentityVerificationClaims)
      .catch(() => undefined);
  }, [isMockProofing]);

  const backToProfilePage = path(PAGES.ProfileHome, { language });

  const handleContinue = () => {
    if (hasRelyingParty && relyingPartyUrl) {
      const redirectUrl = new URL("/terms", relyingPartyUrl);
      window.location.href = redirectUrl.href;
    } else {
      navigate(backToProfilePage);
    }
  };

  const reviewClaims = isMockProofing
    ? mockIdentityClaims
    : identityVerificationClaims;
  const verifiedClaims =
    reviewClaims?.status === "verified"
      ? reviewClaims.verified_claims
      : undefined;

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("DataTransparencyPage.title", { relyingPartyName })}
          </GcdsHeading>

          <GcdsText>
            {t("DataTransparencyPage.descriptionPrefix")}
            <strong>{relyingPartyName}</strong>
            {t("DataTransparencyPage.descriptionSuffix")}
          </GcdsText>
        </GcdsContainer>

        <GcdsContainer>
          <DataInformationCard verifiedClaims={verifiedClaims} />
        </GcdsContainer>

        {hasRelyingParty && (
          <GcdsContainer>
            <AccessibleNotice
              noticeRole="info"
              noticeTitleTag="h2"
              noticeTitle={t("DataTransparencyPage.informationSharingTitle")}
            >
              <GcdsText>
                {t("DataTransparencyPage.informationSharingDescription")}
              </GcdsText>
              <GcdsText>
                <GcdsLink href="#" external>
                  {t("DataTransparencyPage.learnMoreLink")}
                </GcdsLink>
              </GcdsText>
            </AccessibleNotice>
          </GcdsContainer>
        )}

        <GcdsContainer>
          <GcdsButton
            type="button"
            onGcdsClick={(event) => {
              event.preventDefault();
              void handleContinue();
            }}
          >
            {t("DataTransparencyPage.continueButton")}
          </GcdsButton>
        </GcdsContainer>
      </GcdsGrid>
    </GcdsContainer>
  );
}
