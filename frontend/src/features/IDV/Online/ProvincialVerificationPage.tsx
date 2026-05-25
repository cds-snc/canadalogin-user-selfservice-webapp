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
import { useNavigate } from "react-router";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";
import imgBcServicesCard from "../../../assets/images/BC_card.png";
import imgAlbertaAccount from "../../../assets/images/AB_card.png";

export default function ProvincialVerificationPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsText marginBottom="0" size="small">
            {t("ProvincialVerification.pageTitle")}
          </GcdsText>
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
            <li>
              <GcdsText marginBottom="0">
                {t("ProvincialVerification.step3")}
              </GcdsText>
            </li>
          </ol>
        </GcdsContainer>

        <GcdsGrid columns="1" gap="300">
          <GcdsCard
            cardTitle={t("ProvincialVerification.bcServicesCard")}
            cardTitleTag="h3"
            href="#"
            imgSrc={imgBcServicesCard}
            imgAlt="British Columbia Logo"
            // TODO: Replace href with BC Services Card OAuth URL when available
          ></GcdsCard>
          <GcdsCard
            cardTitle={t("ProvincialVerification.albertaAccount")}
            cardTitleTag="h3"
            href="#"
            imgSrc={imgAlbertaAccount}
            imgAlt="Alberta Logo"
            // TODO: Replace href with Alberta.ca Account OAuth URL when available
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
            {t("ProvincialVerification.backButton")}
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
