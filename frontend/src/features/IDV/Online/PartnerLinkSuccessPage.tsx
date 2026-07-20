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
import {
  AVAILABLE_LANGUAGES,
  DEV_ONLY_FEATURE,
  PAGES,
} from "../../../utils/constants";
import { path } from "../../../utils/routeHelpers";

const PARTNER_DISPLAY_NAMES = {
  AB: {
    en: "Alberta.ca Account",
    fr: "Compte Alberta.ca",
  },
  BC: {
    en: "BC Service Card",
    fr: "BC Service Card",
  },
  QC: {
    en: "Québec Digital Identity",
    fr: "Identité numérique du Québec",
  },
} as const;

type PartnerId = keyof typeof PARTNER_DISPLAY_NAMES;
type SupportedLanguage = keyof typeof AVAILABLE_LANGUAGES;

function isPartnerId(value: string): value is PartnerId {
  return value in PARTNER_DISPLAY_NAMES;
}

function isSupportedLanguage(value: string): value is SupportedLanguage {
  return value in AVAILABLE_LANGUAGES;
}

export default function PartnerLinkSuccessPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("idv");
  const { language, journeyType, partnerId } = useParams();

  if (!DEV_ONLY_FEATURE) {
    return null;
  }

  const normalizedPartnerId = (partnerId ?? "").toUpperCase();

  if (!isPartnerId(normalizedPartnerId)) {
    return null;
  }

  const normalizedLanguage = (language ?? "").toLowerCase();
  const displayLanguage = isSupportedLanguage(normalizedLanguage)
    ? normalizedLanguage
    : AVAILABLE_LANGUAGES.en;
  const partnerName =
    PARTNER_DISPLAY_NAMES[normalizedPartnerId][displayLanguage];
  const detailsConfirmationPage = path(PAGES.idvDetailsConfirmationPage, {
    language,
    journeyType,
  });

  return (
    <GcdsContainer role="main">
      <GcdsGrid columns="1" gap="450">
        <GcdsContainer>
          <GcdsHeading tag="h1">
            {t("PartnerLinkSuccess.heading", { partnerName })}
          </GcdsHeading>
        </GcdsContainer>

        <GcdsContainer>
          <GcdsNotice
            noticeRole="info"
            noticeTitleTag="h2"
            noticeTitle={t("PartnerLinkSuccess.noticeTitle", {
              partnerName,
            })}
          >
            <GcdsText>
              {t("PartnerLinkSuccess.noticeText", {
                partnerName,
              })}
            </GcdsText>
          </GcdsNotice>
        </GcdsContainer>

        <GcdsGrid columns="max-content" gap="200">
          <GcdsButton
            type="button"
            onClick={() => {
              navigate(detailsConfirmationPage);
            }}
          >
            {t("PartnerLinkSuccess.continueButton")}
          </GcdsButton>
        </GcdsGrid>
      </GcdsGrid>
    </GcdsContainer>
  );
}
