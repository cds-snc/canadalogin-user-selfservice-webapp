import {
  GcdsButton,
  GcdsGrid,
  GcdsNotice,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function IdentityVerificationSuccess() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");
  const { t: tLayout } = useTranslation("layout");

  const detailsConfirmationPage = path(PAGES.idvDetailsConfirmationPage, {
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
          <GcdsHeading tag="h1">
            {t("IdentityVerificationSuccess.heading")}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("IdentityVerificationSuccess.moreInfoTitle")}
          >
            <GcdsText>
              {t("IdentityVerificationSuccess.moreInfoBody", {
                appName: tLayout("TopNavBar.appName"),
              })}
            </GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsGrid columns="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              navigate(detailsConfirmationPage);
            }}
          >
            {t("IdentityVerificationSuccess.continueButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
