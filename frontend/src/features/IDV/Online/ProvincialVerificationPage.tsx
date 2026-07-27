import {
  GcdsButton,
  GcdsCard,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  DEV_ONLY_FEATURE,
  OIDC_REDIRECT,
  PAGES,
  PROVINCIAL_PARTNERS,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import imgBcServicesCard from "../../../assets/images/BC_card.png";
import imgAlbertaAccount from "../../../assets/images/AB_card.png";
import imgQuebecAccount from "../../../assets/images/QC_card.png";

export default function ProvincialVerificationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const buildPartnerLoginHref = (
    partnerId: (typeof PROVINCIAL_PARTNERS)[keyof typeof PROVINCIAL_PARTNERS],
  ) => {
    const url = new URL(OIDC_REDIRECT.login, window.location.origin);
    const filteredSearchParams = new URLSearchParams(location.search);
    filteredSearchParams.delete("returnToPage");
    const filteredSearch = filteredSearchParams.toString();
    const partnerSuccessPage = path(PAGES.idvPartnerLinkSuccessPage, {
      language,
      journeyType,
      partnerId,
    });
    const returnToPage = filteredSearch
      ? `${partnerSuccessPage}?${filteredSearch}`
      : partnerSuccessPage;
    url.searchParams.set("returnToPage", returnToPage);
    url.searchParams.set("partner", partnerId.toLowerCase());

    return url.toString();
  };

  const bcPartnerLoginHref = buildPartnerLoginHref(PROVINCIAL_PARTNERS.bc);
  const abPartnerLoginHref = buildPartnerLoginHref(PROVINCIAL_PARTNERS.ab);
  const quebecPartnerLoginHref = buildPartnerLoginHref(PROVINCIAL_PARTNERS.qc);
  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("ProvincialVerification.heading")}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsText>
            <strong>{t("ProvincialVerification.followSteps")}</strong>
          </GcdsText>
          <ol>
            <li>
              <GcdsText marginBottom="0">
                {t("ProvincialVerification.step1")}
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("ProvincialVerification.step2")}
              </GcdsText>
            </li>
          </ol>
        </GcdsContainer>

        <GcdsGrid columns="1" gap="300">
          <GcdsCard
            cardTitle={t("ProvincialVerification.bcServicesCard")}
            cardTitleTag="h3"
            href={bcPartnerLoginHref}
            imgSrc={imgBcServicesCard}
            imgAlt="British Columbia Logo"
          ></GcdsCard>
          <GcdsCard
            cardTitle={t("ProvincialVerification.albertaAccount")}
            cardTitleTag="h3"
            href={abPartnerLoginHref}
            imgSrc={imgAlbertaAccount}
            imgAlt="Alberta Logo"
          ></GcdsCard>
          <GcdsCard
            cardTitle={t("ProvincialVerification.quebecAccount")}
            cardTitleTag="h3"
            href={quebecPartnerLoginHref}
            imgSrc={imgQuebecAccount}
            imgAlt="Québec Logo"
          ></GcdsCard>
        </GcdsGrid>

        <GcdsGrid columns="max-content" gap="200">
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onClick={() => {
              navigate(-1);
            }}
          >
            {t("ProvincialVerification.chooseDifferentMethodButton")}
          </GcdsButton>
        </GcdsGrid>

        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("ProvincialVerification.moreInfoTitle")}
        >
          {
            // TODO: populate with real URL once available
          }
          <GcdsLink href={"#"} external={true}>
            {t("ProvincialVerification.learnMoreLink")}
          </GcdsLink>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
