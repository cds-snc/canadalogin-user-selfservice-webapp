import { GcdsContainer, GcdsLink, GcdsText } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import {
  gcHelpCentreLinks,
  PRIVACY_NOTICE_LINKS,
} from "../../../../utils/constants";

export default function PasskeyInfoPanel() {
  const { t, i18n } = useTranslation("mfa");
  const language = i18n.resolvedLanguage?.startsWith("fr") ? "fr" : "en";
  const privacyNoticeHref = PRIVACY_NOTICE_LINKS[language];

  return (
    <GcdsContainer>
      <GcdsText marginBottom="0">
        {<strong>{t("Manage2FAVerifications.passkeysSimplerSignIn")}</strong>}
      </GcdsText>
      <ul>
        <li>
          <GcdsText marginBottom="0">
            {<strong>{t("Manage2FAVerifications.whatArePasskeys")}</strong>}
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("Manage2FAVerifications.passkeysDescription")}
          </GcdsText>
        </li>
        <li>
          <GcdsText marginBottom="0">
            {<strong>{t("Manage2FAVerifications.whereSaved")}</strong>}
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("Manage2FAVerifications.savedDescription")}
          </GcdsText>
        </li>
        <li>
          <GcdsText marginBottom="0">
            {<strong>{t("Manage2FAVerifications.howIsMyInfoUsed")}</strong>}
          </GcdsText>
          <GcdsText marginBottom="0">
            {t("Manage2FAVerifications.howIsMyInfoUsedPt1")}
            <strong>{t("Manage2FAVerifications.howIsMyInfoUsedBold")}</strong>
            {t("Manage2FAVerifications.howIsMyInfoUsedPt2")}
            <GcdsLink href={privacyNoticeHref} target="_blank">
              {t("Manage2FAVerifications.privacyNoticeLink")}
            </GcdsLink>
            {"."}
          </GcdsText>
        </li>
      </ul>
      <GcdsText marginBottom="0">
        {" "}
        <GcdsLink
          href={gcHelpCentreLinks.learnAboutPasskeys[language]}
          target="_blank"
        >
          {t("Manage2FAVerifications.learnMorePasskeys")}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
