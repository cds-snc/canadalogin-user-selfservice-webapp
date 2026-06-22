import { GcdsButton, GcdsNotice, GcdsText } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";

export default function CompleteIdentityProofingNotice() {
  const { language } = useParams<{ language: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const startIdentityProofingPage = `/${language ?? "en"}/idv`;

  return (
    <GcdsNotice
      noticeRole="info"
      noticeTitleTag="h2"
      noticeTitle={t("CompleteIdentityProofing.noticeTitle")}
    >
      <GcdsText>{t("CompleteIdentityProofing.noticeDescription")}</GcdsText>
      <GcdsButton
        type="button"
        buttonRole="secondary"
        onGcdsClick={() => {
          navigate(startIdentityProofingPage);
        }}
      >
        {t("CompleteIdentityProofing.noticeCta")}
      </GcdsButton>
    </GcdsNotice>
  );
}
