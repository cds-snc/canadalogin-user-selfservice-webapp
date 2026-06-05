import {
  GcdsCard,
  GcdsContainer,
  GcdsErrorSummary,
  GcdsGrid,
  GcdsHeading,
  GcdsText,
} from "@gcds-core/components-react";
import { useEffect } from "react";
import { useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { useError } from "../../hooks/useError";
import { useNavigateHelper } from "../../hooks/useNavigate";
import { PAGES, SESSION_STORAGE_KEYS } from "../../utils/constants";
import { path } from "../../utils/routeHelpers";
import { useUser } from "../Providers/useUser";
import { trackCardClick } from "../../utils/gatag";
import imgPersonalInfo from "../../assets/icons/personal_info_icon.svg";
import imgSecuritySettings from "../../assets/icons/security_settings_icon.svg";

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

  useEffect(() => {
    const shouldRedirectToSecuritySettings =
      sessionStorage.getItem(
        SESSION_STORAGE_KEYS.passwordChangeRedirectToSecurity,
      ) === "true";

    if (!shouldRedirectToSecuritySettings) {
      return;
    }

    sessionStorage.removeItem(
      SESSION_STORAGE_KEYS.passwordChangeRedirectToSecurity,
    );
    navigateHelper(securitySettingsLink, true);
  }, [navigateHelper, securitySettingsLink]);

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
      </GcdsGrid>
    </GcdsContainer>
  );
}
