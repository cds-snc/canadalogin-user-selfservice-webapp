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
import { useParams } from "react-router";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import imgBcServicesCard from "../../../assets/images/BC_card.png";
import imgAlbertaAccount from "../../../assets/images/AB_card.png";
import imgQuebecAccount from "../../../assets/images/QC_card.png";

export default function ProvincialVerificationPage() {
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const inProgressPage = path(PAGES.idvInProgressIDVPage, {
    language,
    journeyType,
  });

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
          href={inProgressPage}
          imgSrc={imgBcServicesCard}
          imgAlt="British Columbia Logo"
        ></GcdsCard>
        <GcdsCard
          cardTitle={t("ProvincialVerification.albertaAccount")}
          cardTitleTag="h3"
          href={inProgressPage}
          imgSrc={imgAlbertaAccount}
          imgAlt="Alberta Logo"
        ></GcdsCard>
        <GcdsCard
          cardTitle={t("ProvincialVerification.quebecAccount")}
          cardTitleTag="h3"
          href={inProgressPage}
          imgSrc={imgQuebecAccount}
          imgAlt="Québec Logo"
        ></GcdsCard>

        <GcdsButton
          type="button"
          buttonRole="secondary"
          onClick={() => {
            window.history.back();
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
