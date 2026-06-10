import {
  GcdsButton,
  GcdsGrid,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
// import { useNavigate } from "react-router";
import { DEV_ONLY_FEATURE } from "../../../utils/constants";

export default function MobileCompleteConfirmation() {
  // const navigate = useNavigate();
  const { t } = useTranslation("idv");

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("MobileCompleteConfirmation.heading")}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("MobileCompleteConfirmation.moreInfoTitle")}
          >
            {
              // TODO: populate with real URL once available
            }
            <GcdsText>{t("MobileCompleteConfirmation.moreInfoBody")}</GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              // TODO: navigate to next IDV step
            }}
          >
            {t("MobileCompleteConfirmation.continueButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
