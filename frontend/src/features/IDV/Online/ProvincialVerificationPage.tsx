import {
  GcdsButton,
  GcdsCard,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
  GcdsContainer,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useTranslation } from "react-i18next";
import { useParams, useNavigate } from "react-router";
import { PAGES, DEV_ONLY_FEATURE } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import imgBcServicesCard from "../../../assets/images/BC_card.png";
import imgAlbertaAccount from "../../../assets/images/AB_card.png";
import imgQuebecAccount from "../../../assets/images/QC_card.png";

export default function ProvincialVerificationPage() {
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");
  const navigate = useNavigate();

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  const inProgressPage = path(PAGES.idvInProgressIDVPage, {
    language,
    journeyType,
  });

  const handleProvinceClick = (province: "BC" | "AB" | "QC") => {
    navigate(inProgressPage, {
      state: { verificationMethod: "provincial", province },
    });
  };

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{t("ProvincialVerification.heading")}</GcdsHeading>

      <section>
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
      </section>

      <GcdsGrid columns="1fr">
        <GcdsCard
          cardTitle={t("ProvincialVerification.bcServicesCard")}
          cardTitleTag="h3"
          href="#"
          onGcdsClick={(event) => {
            event.preventDefault();
            handleProvinceClick("BC");
          }}
          imgSrc={imgBcServicesCard}
          imgAlt="British Columbia Logo"
        ></GcdsCard>
        <GcdsCard
          cardTitle={t("ProvincialVerification.albertaAccount")}
          cardTitleTag="h3"
          href="#"
          onGcdsClick={(event) => {
            event.preventDefault();
            handleProvinceClick("AB");
          }}
          imgSrc={imgAlbertaAccount}
          imgAlt="Alberta Logo"
        ></GcdsCard>
        <GcdsCard
          cardTitle={t("ProvincialVerification.quebecAccount")}
          cardTitleTag="h3"
          href="#"
          onGcdsClick={(event) => {
            event.preventDefault();
            handleProvinceClick("QC");
          }}
          imgSrc={imgQuebecAccount}
          imgAlt="Québec Logo"
        ></GcdsCard>

        <GcdsButton
          type="button"
          buttonRole="secondary"
          onClick={() => {
            navigate(-1);
          }}
        >
          {t("ProvincialVerification.chooseDifferentMethodButton")}
        </GcdsButton>

        <AccessibleNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("ProvincialVerification.moreInfoTitle")}
        >
          {
            // TODO: populate with real URL once available
          }
          <GcdsLink
            href={"#"}
            external={true}
            style={{ textDecoration: "underline" }}
          >
            {t("ProvincialVerification.learnMoreLink")}
          </GcdsLink>
        </AccessibleNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
