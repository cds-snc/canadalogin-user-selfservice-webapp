import {
  GcdsCard,
  GcdsContainer,
  GcdsErrorSummary,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useError } from "../../hooks/useError";
import { useNavigateHelper } from "../../hooks/useNavigate";
import {
  DEV_ONLY_FEATURE,
  PAGES,
  manageDashboardLinks,
} from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { useUser } from "../Providers/useUser";
import { trackCardClick } from "../../utils/gatag";
import imgPersonalInfo from "../../assets/icons/personal_info_icon.svg";
import imgSecuritySettings from "../../assets/icons/security_settings_icon.svg";
import imgConnectedServices from "../../assets/icons/connected_services_icon.svg";
import imgHelpAndSupport from "../../assets/icons/help_support_icon.svg";

type GcdsNavigationEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

export default function ManageDashboard() {
  const { language } = useParams();
  const { t } = useTranslation("dashboard");
  const { state } = useUser();
  const { getError, hasErrors } = useError();
  const username =
    state?.userProfile?.name?.givenName || state?.userProfile?.name?.familyName;
  const error = getError("#dashboard");
  const navigateHelper = useNavigateHelper();

  const personalInformationLink = path(PAGES.ProfileHome, {
    language,
  });
  const securitySettingsLink = path(PAGES.securitySettings, {
    language,
  });
  const connectedServicesLink = path(PAGES.connectedServices, {
    language,
  });
  const helpAndSupportLink =
    language === "fr"
      ? manageDashboardLinks.helpAndSupport.fr
      : manageDashboardLinks.helpAndSupport.en;

  const handlePersonalInfoClick = (event: GcdsNavigationEvent) => {
    event.preventDefault();

    trackCardClick({
      card_name: "Personal Information",
      card_type: "navigation",
      destination: personalInformationLink,
    });

    navigateHelper(event.detail);
  };

  const handleSecuritySettingsClick = (event: GcdsNavigationEvent) => {
    event.preventDefault();

    trackCardClick({
      card_name: "Security Settings",
      card_type: "navigation",
      destination: securitySettingsLink,
    });

    navigateHelper(event.detail);
  };

  const handleConnectedServicesClick = (event: GcdsNavigationEvent) => {
    event.preventDefault();

    trackCardClick({
      card_name: "Connected Services",
      card_type: "navigation",
      destination: connectedServicesLink,
    });

    navigateHelper(event.detail);
  };

  const handleHelpAndSupportClick = (event: GcdsNavigationEvent) => {
    event.preventDefault();

    trackCardClick({
      card_name: "Help and Support",
      card_type: "navigation",
      destination: helpAndSupportLink,
    });

    window.open(helpAndSupportLink, "_blank", "noopener,noreferrer");
  };

  return (
    <GcdsContainer role="main">
      {hasErrors() && (
        <GcdsErrorSummary
          data-testid="errorSummary"
          errorLinks={`{"#dashboard": "${error.errorMsg}"}`}
          heading={typeof error.heading === "string" ? error.heading : ""}
        />
      )}
      <GcdsHeading tag="h1">
        {t("ManageDashboard.welcome")} {username}
      </GcdsHeading>

      <GcdsGrid columns="repeat(auto-fit, minmax(200px, 450px))">
        <GcdsCard
          className="dashboard-card"
          cardTitle={t("ManageDashboard.personalInfo")}
          cardTitleTag="h3"
          href={personalInformationLink}
          onGcdsClick={handlePersonalInfoClick}
          imgSrc={imgPersonalInfo}
        >
          <GcdsText marginBottom="0">
            {t("ManageDashboard.personalInfoDescription")}
          </GcdsText>
        </GcdsCard>
        <GcdsCard
          className="dashboard-card"
          cardTitle={t("ManageDashboard.securitySettings")}
          cardTitleTag="h3"
          href={securitySettingsLink}
          onGcdsClick={handleSecuritySettingsClick}
          imgSrc={imgSecuritySettings}
        >
          <GcdsText marginBottom="0">
            {t("ManageDashboard.securitySettingsDescription")}
          </GcdsText>
          <ul>
            <li>
              <GcdsText marginBottom="0">
                {t("ManageDashboard.securitySettingsPhone")}
              </GcdsText>
            </li>
            <li>
              <GcdsText marginBottom="0">
                {t("ManageDashboard.securitySettingsPasskey")}
              </GcdsText>
            </li>
          </ul>
        </GcdsCard>
        {DEV_ONLY_FEATURE && (
          <GcdsCard
            className="dashboard-card"
            cardTitle={t("ManageDashboard.connectedServices")}
            cardTitleTag="h3"
            href={connectedServicesLink}
            onGcdsClick={handleConnectedServicesClick}
            imgSrc={imgConnectedServices}
          >
            <GcdsText marginBottom="0">
              {t("ManageDashboard.connectedServicesDescription")}
            </GcdsText>
          </GcdsCard>
        )}
        <GcdsCard
          className="dashboard-card"
          cardTitle={t("ManageDashboard.helpAndSupport")}
          cardTitleTag="h3"
          href={helpAndSupportLink}
          onGcdsClick={handleHelpAndSupportClick}
          imgSrc={imgHelpAndSupport}
        >
          <GcdsText marginBottom="0">
            {t("ManageDashboard.helpAndSupportDescription")}
          </GcdsText>
        </GcdsCard>
      </GcdsGrid>
    </GcdsContainer>
  );
}
