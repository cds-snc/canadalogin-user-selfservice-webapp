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
  const isEmailInfo =
    information === ServicesWithAccessInfoSectionInformation.EMAIL_ADDRESS;
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

  const description = isEmailInfo
    ? t("ServicesWithAccessInfo.emailDescription")
    : t("ServicesWithAccessInfo.description", {
        information: informationMap[information],
      });
  const notConnectedNotice = isEmailInfo
    ? t("ServicesWithAccessInfo.emailNotConnectedNotice")
    : t("ServicesWithAccessInfo.notConnectedNotice", {
        information: informationMap[information],
      });
  const searchOtherAccounts = isEmailInfo
    ? t("ServicesWithAccessInfo.emailSearchOtherAccounts")
    : t("ServicesWithAccessInfo.searchOtherAccounts");
  const gcAccountDirectory = isEmailInfo
    ? t("ServicesWithAccessInfo.emailGcAccountDirectory")
    : t("ServicesWithAccessInfo.gcAccountDirectory");

  return (
    <GcdsDetails
      detailsTitle={t("ServicesWithAccessInfo.title", {
        information: informationMap[information],
      })}
    >
      <GcdsText>{description}</GcdsText>
      <GcdsText>{notConnectedNotice}</GcdsText>
      <GcdsText>
        {searchOtherAccounts}&nbsp;
        <GcdsLink
          href={EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory}
          target="_blank"
        >
          {gcAccountDirectory}
        </GcdsLink>
        .
      </GcdsText>
    </GcdsDetails>
  );
}
