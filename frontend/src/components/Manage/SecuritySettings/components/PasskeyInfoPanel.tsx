import { GcdsContainer, GcdsLink, GcdsText } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";

export default function PasskeyInfoPanel() {
  const { t } = useTranslation("mfa");

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
            {/* TODO: add correct href once URL is available */}
            <GcdsLink href="#" target="_blank">
              {t("Manage2FAVerifications.privacyNoticeLink")}
            </GcdsLink>
            {"."}
          </GcdsText>
        </li>
      </ul>
      {/* TODO: add correct href once URL is available */}
      <GcdsText marginBottom="0">
        {" "}
        <GcdsLink href="#" target="_blank">
          {t("Manage2FAVerifications.learnMorePasskeys")}
        </GcdsLink>
      </GcdsText>
    </GcdsContainer>
  );
}
