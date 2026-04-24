import {
  GcdsContainer,
  GcdsNavGroup,
  GcdsNavLink,
  GcdsText,
  GcdsTopNav,
} from "@gcds-core/components-react";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { useTranslation } from "react-i18next";
import { path } from "../../utils/routeHelpers";
import { useUser } from "../Providers/useUser";
import { PAGES } from "../../utils/constants";
import { authService } from "../../services/authService";
import { userProfileDispatch } from "../../utils/userProfileDispatch";

interface TopNavProps {
  currentLang: string;
}

type NavigationEvent = {
  preventDefault: () => void;
};

export default function TopNav({ currentLang }: TopNavProps) {
  const { t, i18n } = useTranslation("layout");
  const { state, dispatch } = useUser();
  const { setLoading } = userProfileDispatch(dispatch);

  const rpInfo = state.relyingPartyInfo;
  const localizedDetail = rpInfo?.localized?.[i18n.language];
  const relyingPartyLinkName = localizedDetail?.name ?? rpInfo?.linkName ?? "";
  const relyingPartyUrl = localizedDetail?.url ?? rpInfo?.url ?? "";
  const shouldRenderRelyingPartyLink = relyingPartyLinkName && relyingPartyUrl;

  const { mobile, tablet } = useBreakpoints();

  const homeLink = path(PAGES.manageDashboard, { language: currentLang });
  const profileLink = path(PAGES.ProfileHome, { language: currentLang });
  const securitySettingsLink = path(PAGES.securitySettings, {
    language: currentLang,
  });

  const handleLogout = async (event: NavigationEvent) => {
    event.preventDefault();
    setLoading(true, t("TopNavBar.signingOut")); // Use logout loading text
    try {
      const response = await authService.logout();
      const redirectUrl = response?.data?.redirect_url || null;

      // Check if response has redirect_url
      if (redirectUrl) {
        // form been submitted in authService.logout
        return;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = "/";
      }
    } catch (error) {
      console.error("Logout failed:", error);
      // Update loading text to show error
      setLoading(true, t("TopNavBar.signOutFailed"));
      // Redirect after error
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    }
  };

  const navLinksJsx = (
    <>
      <GcdsNavLink href={homeLink}>{t("TopNavBar.home")}</GcdsNavLink>
      <GcdsNavLink href={profileLink}>
        {t("TopNavBar.personalInfo")}
      </GcdsNavLink>
      <GcdsNavLink href={securitySettingsLink}>
        {t("TopNavBar.securitySettings")}
      </GcdsNavLink>
      {shouldRenderRelyingPartyLink && (
        <GcdsNavLink href={relyingPartyUrl}>
          {t("TopNavBar.returnTo") + relyingPartyLinkName}
        </GcdsNavLink>
      )}
      <GcdsNavLink href="#" onClick={handleLogout}>
        {t("TopNavBar.signOut")}
      </GcdsNavLink>
    </>
  );

  const renderMobileNavigation = () => (
    <>
      <GcdsContainer slot="menu">
        <div className="gcds-top-nav-container">
          <div className="gcds-top-nav-width-spacer">
            <GcdsText marginBottom="0">
              <strong>{t("TopNavBar.appName")}</strong>
            </GcdsText>
          </div>
        </div>
      </GcdsContainer>
      <GcdsTopNav
        slot="menu"
        label="Top navigation"
        alignment="end"
        lang={currentLang}
      >
        {navLinksJsx}
      </GcdsTopNav>
    </>
  );

  const renderDesktopNavigation = () => (
    <GcdsTopNav
      slot="menu"
      label="Top navigation"
      alignment="end"
      className="gcds-top-nav"
    >
      <GcdsNavLink href={homeLink} slot="home">
        {t("TopNavBar.appName")}
      </GcdsNavLink>
      <GcdsNavGroup open-trigger="Menu" menu-label="Menu">
        {navLinksJsx}
      </GcdsNavGroup>
    </GcdsTopNav>
  );

  const renderNavigation = () => {
    return mobile || tablet
      ? renderMobileNavigation()
      : renderDesktopNavigation();
  };

  return renderNavigation();
}
