import { GcdsDetails, GcdsText, GcdsLink } from "@gcds-core/components-react";
import { useTranslation } from "react-i18next";
import {
  EXTERNAL_NAVIGATION_LINKS,
  ServicesWithAccessInfoSectionInformation,
} from "../../utils/constants";

interface ServicesWithAccessInfoSectionProps {
  currentLang: string;
  information: string;
}

export default function ServicesWithAccessInfoSection({
  currentLang: _currentLang,
  information,
}: ServicesWithAccessInfoSectionProps) {
  const { t } = useTranslation("layout");
  const informationMap: Record<string, string> = {
    [ServicesWithAccessInfoSectionInformation.NAME]: t(
      "ServicesWithAccessInfo.name",
    ),
    [ServicesWithAccessInfoSectionInformation.CONTACT_PHONE_NUMBER]: t(
      "ServicesWithAccessInfo.contactPhone",
    ),
    [ServicesWithAccessInfoSectionInformation.LANGUAGE_PREFERENCE]: t(
      "ServicesWithAccessInfo.languagePreference",
    ),
    [ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS]: t(
      "ServicesWithAccessInfo.emailAddress",
    ),
  };

  return (
    <GcdsDetails
      detailsTitle={t("ServicesWithAccessInfo.title", {
        information: informationMap[information],
      })}
    >
      <GcdsText>
        {t("ServicesWithAccessInfo.description", {
          information: informationMap[information],
        })}
      </GcdsText>
      <GcdsText>
        {t("ServicesWithAccessInfo.notConnectedNotice", {
          information: informationMap[information],
        })}
      </GcdsText>
      <GcdsText>
        {t("ServicesWithAccessInfo.searchOtherAccounts")}&nbsp;
        <GcdsLink href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}>
          {t("ServicesWithAccessInfo.gcAccountDirectory")}
        </GcdsLink>
        .
      </GcdsText>
    </GcdsDetails>
  );
}
