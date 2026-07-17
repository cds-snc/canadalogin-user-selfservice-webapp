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

import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function ProvincialLinkedPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const idvSuccessPage = path(PAGES.idvIdentityVerificationSuccessPage, {
    language,
    journeyType,
  });

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">{t("ProvincialLinked.heading")}</GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsNotice
            noticeRole="success"
            noticeTitleTag="h2"
            noticeTitle={t("ProvincialLinked.noticeTitle")}
          >
            <GcdsText>{t("ProvincialLinked.noticeBody")}</GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsGrid columns="max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              navigate(idvSuccessPage);
            }}
          >
            {t("ProvincialLinked.continueButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
