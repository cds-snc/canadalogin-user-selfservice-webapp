import { GcdsButton, GcdsText } from "@gcds-core/components-react";

import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import { IDV_JOURNEY_TYPE } from "../constants";
import { type IdentityVerificationClaimsResponse } from "../api/identityVerificationApi";
import { useState } from "react";

export default function CompleteIdentityProofingNotice() {
  const { language } = useParams<{ language: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const [identityVerificationClaims] =
    useState<IdentityVerificationClaimsResponse>();
  const startIdentityProofingPage = path(PAGES.idvStartIdentityProofingPage, {
    language,
    journeyType: IDV_JOURNEY_TYPE.START,
  });
  const InProgressIdentityProofingPage = path(
    PAGES.idvInPersonProofingInProgressPage,
    {
      language,
    },
  );

  const handleNavigation = () => {
    const status = identityVerificationClaims?.status;

    const destination =
      status === "pending" || status === "in_progress"
        ? InProgressIdentityProofingPage
        : startIdentityProofingPage;

    navigate(destination);
  };

  return (
    <AccessibleNotice
      noticeRole="info"
      noticeTitleTag="h2"
      noticeTitle={t("CompleteIdentityProofing.noticeTitle")}
    >
      <GcdsText>{t("CompleteIdentityProofing.noticeDescription")}</GcdsText>
      <GcdsButton
        type="button"
        buttonRole="secondary"
        onGcdsClick={handleNavigation}
      >
        {t("CompleteIdentityProofing.noticeCta")}
      </GcdsButton>
    </AccessibleNotice>
  );
}
