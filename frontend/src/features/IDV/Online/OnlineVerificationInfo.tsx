import {
  GcdsButton,
  GcdsDetails,
  GcdsGrid,
  GcdsLink,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import {
  DEV_ONLY_FEATURE,
} from "../../../utils/constants";
import { identityVerificationApi } from "../api/identityVerificationApi";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";

export default function OnlineVerificationInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");


  const handleContinue = () => {
    identityVerificationApi
      .getOnlineIdentityVerificationUrl()
      .then((response) => {
        const { redirect_url } = (
          response as { data: { redirect_url: string } }
        ).data;
        window.location.href = redirect_url;
      })
      .catch(() => {
        // TODO: handle API error
      });
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("OnlineVerificationInfo.heading")}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsText>
            <strong>{t("OnlineVerificationInfo.followSteps")}</strong>
          </GcdsText>
          <ol>
            <li>
              <GcdsText marginBottom="0">
                {t("OnlineVerificationInfo.step1")}
              </GcdsText>
              <GcdsDetails
                detailsTitle={t("OnlineVerificationInfo.listOfAcceptableIds")}
              >
                <ul
                  aria-label={t("OnlineVerificationInfo.listOfAcceptableIds")}
                >
                  {APPROVED_DOCUMENT_VALUES.filter(
                    (docValue) => docValue !== "noIds",
                  ).map((docValue) => (
                    <li key={docValue}>{t(`ApprovedDocuments.${docValue}`)}</li>
                  ))}
                </ul>
              </GcdsDetails>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("OnlineVerificationInfo.step2")}
              </GcdsText>
            </li>
            <li>
              <GcdsText>{t("OnlineVerificationInfo.step3")}</GcdsText>
            </li>
          </ol>
          <GcdsText marginBottom="0">
            {t("OnlineVerificationInfo.planForTime")}
          </GcdsText>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onGcdsClick={(ev) => {
              ev.preventDefault();
              handleContinue();
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
            {t("OnlineVerificationInfo.backButton")}
          </GcdsButton>
        </GcdsGrid>

        <GcdsNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("OnlineVerificationInfo.moreInfoTitle")}
        >
          {
            // TODO: populate with real URL once available
          }
          <GcdsLink href={"#"} external={true}>
            {t("OnlineVerificationInfo.learnMoreLink")}
          </GcdsLink>
        </GcdsNotice>
      </GcdsGrid>
    </GcdsContainer>
  );
}
