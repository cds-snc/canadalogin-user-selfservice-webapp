import { useEffect } from "react";
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
import { useUser } from "../../components/Providers/useUser";
import ViewLanguagePreferences from "../../features/LanguagePreference/components/ViewLanguagePreference";
import ProvenInformationCard from "../IDV/ProvenInformationCard";
import ViewProfileNameCard from "../ProfileName/components/ViewProfileNameCard";
import ViewContactPhoneNumber from "../ContactPhoneNumber/components/ViewContactPhoneNumber";
import DisplayEmailInfo from "../ProfileName/components/ViewEmailInfo";
import { identityVerificationApi } from "./api/identityVerificationApi";
import { path } from "../../utils/routeHelpers";

export default function ConfirmIdentityDetails() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");
  const { language, journeyType } = useParams();
  const { state } = useUser();

  const phoneNumbers = state?.userProfile?.phoneNumbers || [];
  const localizedDetail = state.relyingPartyInfo?.localized?.[i18n.language];
  const fallbackRedirectUrl =
    localizedDetail?.url ?? state.relyingPartyInfo?.url ?? "/";
  const backtoProfilePage = path(PAGES.ProfileHome, { language: language });

  let rp_redirect_target_url = "";
  useEffect(() => {
    const fetchRedirectUrl = async () => {
      if (journeyType === IDV_JOURNEY_TYPE.REQUIRED) {
        try {
          const response =
            await identityVerificationApi.getPostIdvRedirectUrl();
          rp_redirect_target_url =
            response?.data?.redirect_url || fallbackRedirectUrl;
        } catch (error) {
          console.error("Unable to resolve post-IDV redirect URL:", error);
        }
      }
    };
    fetchRedirectUrl();
  }, [journeyType]);

  const handleContinue = () => {
    switch (journeyType) {
      case IDV_JOURNEY_TYPE.REQUIRED:
        window.location.assign(rp_redirect_target_url);

        break;
      default:
        navigate(backtoProfilePage, {
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
            handleContinue();
          }}
        >
          {t("ConfirmIdentityDetails.confirmAndContinue")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
