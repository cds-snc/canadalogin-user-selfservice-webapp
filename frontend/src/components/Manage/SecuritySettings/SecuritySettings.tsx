import { useParams } from "react-router";
import { format } from "date-fns";
import { enCA, frCA } from "date-fns/locale";
import {
  GcdsContainer,
  GcdsHeading,
  GcdsGrid,
  GcdsText,
  GcdsLink,
} from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import { path } from "../../../utils/routeHelpers";
import { PAGES, DEV_ONLY_FEATURE } from "../../../utils/constants";

import { useUser } from "../../Providers/useUser";
import EnabledBadge from "../../Badges/EnabledBadge";
import VerifiedBadge from "../../Badges/VerifiedBadge";

export default function SecuritySettings() {
  const { language } = useParams();

  const { t } = useTranslation("security");
  const { state } = useUser();
  const lastPasswordChange = state?.userProfile?.details?.pwdChangedTime || "";
  const formattedPasswordChangeDate = lastPasswordChange
    ? language === "fr"
      ? format(new Date(lastPasswordChange), "d MMMM, yyyy", {
          locale: frCA,
        })
      : format(new Date(lastPasswordChange), "MMMM d, yyyy", {
          locale: enCA,
        })
    : "";

  const passwordPage = path(PAGES.password, { language });
  const manage2FAVerificationsPage = path(PAGES.manage2FAVerifications, {
    language,
  });

  return (
    <GcdsContainer role="main">
      <GcdsHeading tag="h1">{t("SecuritySettings.title")}</GcdsHeading>
      <GcdsHeading tag="h2">{t("SecuritySettings.howYouSignIn")}</GcdsHeading>
      <GcdsText>{t("SecuritySettings.keepInfoUpdated")}</GcdsText>
      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3">{t("SecuritySettings.password")}</GcdsHeading>
        <GcdsGrid columns="1fr" gap="300" align-items="center">
          <GcdsText>
            {t("SecuritySettings.lastChangedOn")} {formattedPasswordChangeDate}
          </GcdsText>
          <GcdsLink size="regular" href={passwordPage}>
            {t("SecuritySettings.change")}
          </GcdsLink>
        </GcdsGrid>
      </GcdsContainer>

      <GcdsContainer className="sectionCard">
        <GcdsHeading tag="h3" marginTop="300">
          {t("SecuritySettings.twoStepVerification")}
        </GcdsHeading>
        <GcdsText>{t("SecuritySettings.twoStepDescription")}</GcdsText>
        <GcdsGrid columns="1fr" gap="300" align-items="center">
          <EnabledBadge text={t("SecuritySettings.enabled")} />
          <GcdsLink href={manage2FAVerificationsPage} size="regular">
            {t("SecuritySettings.manage")}
          </GcdsLink>
        </GcdsGrid>
      </GcdsContainer>
    </GcdsContainer>
  );
}
