import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsNotice,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { useUser } from "../../../components/Providers/useUser";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function InPersonProofingInProgress() {
  const { t, i18n } = useTranslation("idv");
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const { state } = useUser();

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const rpName =
    localizedDetail?.name ??
    rpInfo?.linkName ??
    t("StartIdentityProofing.fallbackRpName");

  const resendEmailDate = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType,
  });

  const handleResetMethod = () => {
    navigate(startIdentityProofingPage);
  };

  const handleResendEmail = () => {
    // TODO: wire resend-email action.
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
            {t("InPersonProofingInProgress.noticeText", {
              date: resendEmailDate,
            })}
          </GcdsText>

          <GcdsText>{t("InPersonProofingInProgress.changedMindText")}</GcdsText>
        </GcdsNotice>

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
