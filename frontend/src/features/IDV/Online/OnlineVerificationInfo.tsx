import {
  GcdsButton,
  GcdsDetails,
  GcdsGrid,
  GcdsLink,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";

export default function OnlineVerificationInfo() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");
  const mobileProofingPage = path(PAGES.idvContinueProofingOnMobilePage, {
    language,
    journeyType,
  });

  const onContinue = () => {
    navigate(mobileProofingPage);
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{t("OnlineVerificationInfo.heading")}</GcdsHeading>

      <GcdsText>
        <strong>{t("OnlineVerificationInfo.followSteps")}</strong>
      </GcdsText>
      <GcdsText marginBottom="0">
        <ol>
          <li>
            <GcdsText marginBottom="0">
              {t("OnlineVerificationInfo.step1")}
            </GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              {t("OnlineVerificationInfo.step2")}
            </GcdsText>
          </li>
          <li>
            <GcdsText marginBottom="0">
              {t("OnlineVerificationInfo.step3")}
            </GcdsText>
          </li>
          <GcdsDetails
            detailsTitle={t("OnlineVerificationInfo.listOfAcceptableIds")}
          >
            <ol aria-label={t("OnlineVerificationInfo.listOfAcceptableIds")}>
              {APPROVED_DOCUMENT_VALUES.filter(
                (docValue) => docValue !== "noIds",
              ).map((docValue) => (
                <li key={docValue}>{t(`ApprovedDocuments.${docValue}`)}</li>
              ))}
            </ol>
          </GcdsDetails>
          <li>
            <GcdsText marginBottom="0">
              {t("OnlineVerificationInfo.step4")}
            </GcdsText>
          </li>
        </ol>
      </GcdsText>
      <GcdsText>{t("OnlineVerificationInfo.planForTime")}</GcdsText>

      <GcdsGrid columns="1fr" gap="450">
        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              void onContinue();
            }}
          >
            {t("OnlineVerificationInfo.continueButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onClick={() => {
              navigate(-1);
            }}
          >
            {t("OnlineVerificationInfo.chooseDifferentMethodButton")}
          </GcdsButton>
        </GcdsGrid>

        <AccessibleNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("OnlineVerificationInfo.moreInfoTitle")}
        >
          {
            // TODO: populate with real URL once available
          }
          <GcdsLink
            href={"#"}
            external={true}
            style={{ textDecoration: "underline" }}
          >
            {t("OnlineVerificationInfo.learnMoreLink")}
          </GcdsLink>
        </AccessibleNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
