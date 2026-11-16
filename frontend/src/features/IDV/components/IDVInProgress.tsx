import {
  GcdsButton,
  GcdsText,
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
} from "@gcds-core/components-react";

import { useNavigate, useParams, useSearchParams } from "react-router";
import { useTranslation } from "react-i18next";
import { PAGES } from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";
import AccessibleNotice from "../../../components/InfoBlocks/AccessibleNotice";

type VerificationMethod = "bluink" | "provincial" | "canada_post" | "service_canada";

export default function IDVInProgress() {
  const navigate = useNavigate();
  const { language, journeyType } = useParams();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation("idv");

  const verificationMethod = searchParams.get("method") as VerificationMethod | null;

  const iDVSuccessPage = path(PAGES.idvDetailsConfirmationPage, {
    language,
    journeyType,
  });

  const getMethodDisplayName = (method: VerificationMethod | null): string => {
    switch (method) {
      case "bluink":
        return t("IDVInProgress.methodBluink", "Bluink verification");
      case "provincial":
        return t("IDVInProgress.methodProvincial", "Provincial verification");
      case "canada_post":
        return t("IDVInProgress.methodCanadaPost", "Canada Post verification");
      case "service_canada":
        return t("IDVInProgress.methodServiceCanada", "Service Canada Centre verification");
      default:
        return t("IDVInProgress.methodUnknown", "Identity verification");
    }
  };

  const handleContinue = async () => {
    navigate(iDVSuccessPage);
  };

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsHeading tag="h1">
          {t("IDVInProgress.heading", "Identity verification in progress")}
        </GcdsHeading>

        <GcdsContainer>
          <GcdsText>
            {t("IDVInProgress.methodInfo", "Verification method:")} {getMethodDisplayName(verificationMethod)}
          </GcdsText>
        </GcdsContainer>

        <AccessibleNotice
          noticeRole="info"
          noticeTitleTag="h2"
          noticeTitle={t("IDVInProgress.keepOpenTitle", "Keep this page open")}
        >
          <GcdsText marginBottom="0">
            {t(
              "IDVInProgress.keepOpenDescription",
              "Refreshing or leaving may interrupt your verification.",
            )}
          </GcdsText>
        </AccessibleNotice>

        <GcdsGrid columns="1" columnsDesktop="max-content max-content" gap="200">
          <GcdsButton
            type="button"
            buttonRole="primary"
            onGcdsClick={handleContinue}
          >
            {t("IDVInProgress.continueButton", "Continue")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
