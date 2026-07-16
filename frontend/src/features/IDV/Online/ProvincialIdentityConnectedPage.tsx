import {
  GcdsButton,
  GcdsContainer,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router";
import { DEV_ONLY_FEATURE, PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

export default function ProvincialIdentityConnectedPage() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const { t } = useTranslation("idv");

  const identityVerificationSuccessPage = path(
    PAGES.idvIdentityVerificationSuccessPage,
    {
      language,
      journeyType,
    },
  );

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1">
          {t("ProvincialVerificationConnected.heading")}
        </GcdsHeading>

        <GcdsText>{t("ProvincialVerificationConnected.body")}</GcdsText>

        <GcdsGrid columns="max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              navigate(identityVerificationSuccessPage);
            }}
          >
            {t("ProvincialVerificationConnected.continueButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
