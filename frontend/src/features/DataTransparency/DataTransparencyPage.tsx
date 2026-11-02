import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
  GcdsLink,
} from "@gcds-core/components-react";

import { PAGES } from "../../utils/constants";
import { useRelyingPartyInfo } from "../../hooks/useRelyingPartyInfo";
import { useUser } from "../../components/Providers/useUser";
import DataInformationCard from "./components/DataInformationCard";
import { path } from "../../utils/routeHelpers";
import {
  identityVerificationApi,
  type IdentityVerificationClaimsResponse,
} from "../../features/IDV/api/identityVerificationApi";

export default function DataTransparencyPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("dataTransparency");
  const { language } = useParams();
  const { relyingPartyUrl, relyingPartyName, hasRelyingParty } =
    useRelyingPartyInfo();
  const { state } = useUser();

  const [identityVerificationClaims, setIdentityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();

  useEffect(() => {
    void identityVerificationApi
      .getClaims()
      .then(setIdentityVerificationClaims)
      .catch(() => undefined);
  }, []);

  const fallbackRedirectUrl = relyingPartyUrl || "/";
  const backToProfilePage = path(PAGES.ProfileHome, { language });

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
    if (hasRelyingParty) {
      await redirectToRelyingParty();
    } else {
      navigate(backToProfilePage);
    }
  };

  const verifiedClaims =
    identityVerificationClaims?.status === "verified"
      ? identityVerificationClaims.verified_claims
      : undefined;

  const userProfile = state.userProfile;

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1" marginTop="0">
            {t("DataTransparencyPage.title", { relyingPartyName })}
          </GcdsHeading>

          <GcdsText>
            {t("DataTransparencyPage.description", { relyingPartyName })}
          </GcdsText>
        </GcdsContainer>

        <GcdsContainer>
          <DataInformationCard
            userProfile={userProfile}
            verifiedClaims={verifiedClaims}
          />
        </GcdsContainer>

        {hasRelyingParty && (
          <GcdsContainer>
            <GcdsHeading tag="h2" marginTop="0">
              {t("DataTransparencyPage.informationSharingTitle")}
            </GcdsHeading>
            <GcdsText>
              {t("DataTransparencyPage.informationSharingDescription")}
            </GcdsText>
            <GcdsText>
              <GcdsLink href="#" external>
                {t("DataTransparencyPage.learnMoreLink")}
              </GcdsLink>
            </GcdsText>
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
