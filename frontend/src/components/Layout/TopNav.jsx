import { useState } from "react";
import { createPortal } from "react-dom";
import {
  GcdsBreadcrumbs,
  GcdsBreadcrumbsItem,
  GcdsContainer,
  GcdsHeader,
  GcdsNavGroup,
  GcdsNavLink,
  GcdsText,
  GcdsTopNav,
} from "@cdssnc/gcds-components-react";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { getPageContent } from "../../utils/functions.jsx";
import { useUser } from "../Providers/useUser";
import { NAVIGATION_LINKS, CONTEXT_ACTIONS } from "../../utils/constants.jsx";
import { authService } from "../../services/authService.jsx";
import Loader from "./Loading.jsx";

export default function TopNav({ currentLang }) {
  const pageContentJson = getPageContent(currentLang, "TopNavBar");
  const { state } = useUser();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(false);

  const relyingPartyLinkName = state.relyingPartyInfo?.linkName;
  const relyingPartyUrl = state.relyingPartyInfo?.url;
  const shouldRenderRelyingPartyLink = relyingPartyLinkName && relyingPartyUrl;

  const { mobile, tablet } = useBreakpoints();

  const handleLogout = async (e) => {
    e.preventDefault();
    setIsLoggingOut(true);
    setLogoutError(false);
    
    try {
      const response = await authService.logout();

      // Check if response has redirect_url and redirect
      if (response && response.data && response.data.redirect_url) {
        window.location.href = response.data.redirect_url;
      } else {
        // Fallback redirect if no redirect_url provided
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Show error message for a brief moment before redirecting
      setLogoutError(true);
      // Redirect after showing error message for 2 seconds
      setTimeout(() => {
        window.location.href = '/';
      }, 2000);
    } 
  };

  const navLinksJsx = (
    <>
      <GcdsNavLink href={`/${currentLang}/`}>
        {pageContentJson["3"]}
      </GcdsNavLink>
      <GcdsNavLink href={`/${currentLang}${NAVIGATION_LINKS.profileHome}`}>
        {pageContentJson["4"]}
      </GcdsNavLink>
      <GcdsNavLink href={`/${currentLang}${NAVIGATION_LINKS.securitySettings}`}>
        {pageContentJson["5"]}
      </GcdsNavLink>
      {shouldRenderRelyingPartyLink && (
        <GcdsNavLink href={relyingPartyUrl}>
          {pageContentJson["6"] + relyingPartyLinkName}
        </GcdsNavLink>
      )}
      <GcdsNavLink href="#" onClick={handleLogout}>{pageContentJson["7"]}</GcdsNavLink>
    </>
  );

  const renderMobileNavigation = () => (
    <>
      <GcdsContainer slot="menu">
        <div className="gcds-top-nav-container">
          <div className="gcds-top-nav-width-spacer">
            <GcdsText marginBottom="0">
              <strong>{pageContentJson["1"]}</strong>
            </GcdsText>
          </div>
        </div>
      </GcdsContainer>
      <GcdsTopNav
        slot="menu"
        label="Top navigation"
        alignment="right"
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
      alignment="right"
      className="gcds-top-nav"
    >
      <GcdsNavLink href="/" slot="home">
        {pageContentJson["1"]}
      </GcdsNavLink>
      <GcdsNavGroup open-trigger="Menu" menu-label="Menu">
        {navLinksJsx}
      </GcdsNavGroup>
    </GcdsTopNav>
  );

  const renderNavigation = () => {
    return mobile || tablet ? renderMobileNavigation() : renderDesktopNavigation();
  };

  if (isLoggingOut) {
    return (
      <>
        {renderNavigation()}
        {createPortal(
          <Loader text={logoutError ? pageContentJson["9"] : pageContentJson["8"]} />,
          document.body
        )}
      </>
    );
  }

  return renderNavigation();
}
