import {
  GcdsButton,
  GcdsContainer,
  GcdsDetails,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useRelyingPartyInfo } from "../../../hooks/useRelyingPartyInfo";
import { inPersonIdentityVerificationApi } from "../api/inPersonIdentityVerificationApi";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

const formatDisplayDate = (value: Date | string, locale: string = "en-CA") =>
  new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);

export default function InPersonProofingInProgress() {
  const { t, i18n } = useTranslation("idv");
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const [sendEmailDate, setSendEmailDate] = useState<string | null>(null);

  const { relyingPartyName: rpName } = useRelyingPartyInfo(i18n.language);

  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType,
  });

  // Fetch the last email sent date on component mount
  useEffect(() => {
    const fetchLastEmailSentDate = async () => {
      const response =
        await inPersonIdentityVerificationApi.getLastEmailSentDate();

      if (!response?.success || !response?.lastEmailSent) {
        return;
      }

      const parsedDate = new Date(response.lastEmailSent);
      if (!Number.isNaN(parsedDate.getTime())) {
        setSendEmailDate(formatDisplayDate(parsedDate, i18n.language));
      }
    };

    void fetchLastEmailSentDate();
  }, [i18n.language]);

  const handleResetMethod = () => {
    navigate(startIdentityProofingPage);
  };

  const handleResendEmail = async () => {
    const response =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode();

    if (!response?.success) {
      return;
    }

    const sentAt = response.data?.sentAt;
    const parsedSentAt = sentAt ? new Date(sentAt) : null;

    if (parsedSentAt && !Number.isNaN(parsedSentAt.getTime())) {
      setSendEmailDate(formatDisplayDate(parsedSentAt, i18n.language));
    }
  };

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("InPersonProofingInProgress.heading", { rpName })}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsNotice
          noticeRole="warning"
          noticeTitleTag="h2"
          noticeTitle={t("InPersonProofingInProgress.noticeHeading")}
        >
          <GcdsText>
            {sendEmailDate
              ? t("InPersonProofingInProgress.noticeText", {
                  date: sendEmailDate,
                })
              : t("InPersonProofingInProgress.noticeTextNoEmail")}
          </GcdsText>

          <GcdsText>{t("InPersonProofingInProgress.changedMindText")}</GcdsText>
        </GcdsNotice>
        <GcdsContainer>
          <GcdsDetails
            detailsTitle={t(
              "InPersonProofingInProgress.completedProofingLabel",
            )}
          />
        </GcdsContainer>
        <GcdsGrid
          columns="1"
          columnsDesktop="max-content max-content"
          gap="200"
        >
          <GcdsButton
            type="button"
            buttonRole="danger"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              handleResetMethod();
            }}
          >
            {t("InPersonProofingInProgress.resetButton")}
          </GcdsButton>
          <GcdsButton
            type="button"
            buttonRole="secondary"
            onGcdsClick={(event: Event) => {
              event.preventDefault();
              handleResendEmail();
            }}
          >
            {t("InPersonProofingInProgress.resendButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
