import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { QRCodeSVG } from "qrcode.react";
import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsLink,
  GcdsText,
} from "@gcds-core/components-react";
import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import "./ContinueProofingOnMobile.css";

const DUMMY_PROOFING_LINK = "canadalogin.ca/prove/daUf30fn2/";
const DUMMY_PROOFING_URL = `https://${DUMMY_PROOFING_LINK}`;

export default function ContinueProofingOnMobile() {
  const { language, journeyType } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const [error, setError] = useState("");
  const successPage = path(PAGES.idvIdentityVerificationSuccessPage, {
    language,
    journeyType,
  });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(DUMMY_PROOFING_URL);
      setError("");
    } catch (error) {
      console.error("Unable to copy mock handoff link:", error);
      setError("ContinueProofingOnMobile.copyError");
    }
  };

  return (
    <GcdsContainer role="main" className="mobile-proofing">
      <GcdsHeading tag="h1">
        {t("ContinueProofingOnMobile.heading")}
      </GcdsHeading>
      <GcdsText>{t("ContinueProofingOnMobile.description")}</GcdsText>
      <AccessibleNotice
        noticeRole="info"
        noticeTitleTag="h2"
        noticeTitle={t("ContinueProofingOnMobile.keepOpen")}
      >
        <GcdsText>{t("ContinueProofingOnMobile.returnHere")}</GcdsText>
      </AccessibleNotice>

      {error && (
        <div role="alert">
          <GcdsText>{t(error)}</GcdsText>
        </div>
      )}

      <GcdsHeading tag="h2">
        {t("ContinueProofingOnMobile.scanInstruction")}
      </GcdsHeading>
      <QRCodeSVG
        value={DUMMY_PROOFING_URL}
        size={360}
        marginSize={4}
        level="M"
        className="mobile-proofing-qr"
        role="img"
        title={t("ContinueProofingOnMobile.qrLabel")}
      />
      <GcdsHeading tag="h3">
        {t("ContinueProofingOnMobile.cannotScan")}
      </GcdsHeading>
      <div className="mobile-proofing-link">
        <GcdsLink
          href={DUMMY_PROOFING_URL}
          onGcdsClick={(event) => event.preventDefault()}
        >
          {DUMMY_PROOFING_LINK}
        </GcdsLink>
        <GcdsButton
          type="button"
          buttonRole="primary"
          onClick={() => void copyLink()}
        >
          {t("ContinueProofingOnMobile.copyLink")}
        </GcdsButton>
      </div>
      <GcdsGrid columns="1" columnsDesktop="max-content max-content" gap="200">
        <GcdsButton
          type="button"
          buttonRole="primary"
          onClick={() => {
            navigate(successPage, {
              state: { mockProofing: true },
            });
          }}
        >
          {t("ContinueProofingOnMobile.continueButton")}
        </GcdsButton>
        <GcdsButton
          type="button"
          buttonRole="secondary"
          onClick={() => {
            navigate(
              path(PAGES.idvProveIdentityOnlinePage, {
                language,
                journeyType,
              }),
            );
          }}
        >
          {t("OnlineVerificationInfo.chooseDifferentMethodButton")}
        </GcdsButton>
      </GcdsGrid>
    </GcdsContainer>
  );
}
