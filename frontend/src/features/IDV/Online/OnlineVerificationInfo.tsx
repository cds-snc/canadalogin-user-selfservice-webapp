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
import { Trans, useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";
import {
  identityVerificationApi,
  type OnlineIdentityVerificationResponse,
} from "../api/identityVerificationApi";
import { APPROVED_DOCUMENT_VALUES } from "../data/approvedDocuments";

export default function OnlineVerificationInfo() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");

  const handleContinue = async (
    response: OnlineIdentityVerificationResponse | undefined,
  ) => {
    if (!response?.online_verification_url) {
      return;
    }
    window.location.assign(response.online_verification_url);
  };

  const onContinue = () => {
    identityVerificationApi
      .postOnlineIdentityVerification()
      .then((response) => handleContinue(response))
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
          <GcdsText marginBottom="0">
            <ol>
              <li>
                <GcdsText marginBottom="0">
                  {t("OnlineVerificationInfo.step1")}
                </GcdsText>
                <GcdsText marginBottom="0">
                  <ol type="a">
                    <li>{t("OnlineVerificationInfo.expiredIdsAccepted")}</li>
                  </ol>
                </GcdsText>
                <GcdsDetails
                  detailsTitle={t("OnlineVerificationInfo.listOfAcceptableIds")}
                >
                  <ol
                    aria-label={t("OnlineVerificationInfo.listOfAcceptableIds")}
                  >
                    {APPROVED_DOCUMENT_VALUES.filter(
                      (docValue) => docValue !== "noIds",
                    ).map((docValue) => (
                      <li key={docValue}>
                        {t(`ApprovedDocuments.${docValue}`)}
                      </li>
                    ))}
                  </ol>
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
          </GcdsText>
          <GcdsText marginBottom="0">
            <Trans
              i18nKey="idv:OnlineVerificationInfo.planForTime"
              values={{
                duration: t("idv:OnlineVerificationInfo.timeDuration"),
              }}
              components={{ strong: <strong /> }}
            />
          </GcdsText>
        </GcdsContainer>

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
