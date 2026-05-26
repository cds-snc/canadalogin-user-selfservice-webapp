import { useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router";
import { useLanguage } from "../Providers/LanguageProvider";
import { useRelyingPartyAnalyticsParams } from "../../hooks/useRelyingPartyAnalyticsParams";
import { getLangValues } from "../../utils/functions";
import { setAnalyticsContext, trackPage } from "../../utils/gatag";
import { PAGES } from "../../utils/constants";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import config from "../../config";

import { GcdsContainer, GcdsText } from "@gcds-core/components-react";

const WIZARD_TRACKED_PAGE_IDS = new Set<string>([
  PAGES.editProfileNamePage,
  PAGES.editLanguagePreferences,
  PAGES.editContactPhoneNumberPage,
  PAGES.editEmailPage,
  PAGES.password,
  PAGES.addMFAPage,
  PAGES.deleteMFAPage,
  PAGES.addFIDO2PasskeyPage,
  PAGES.deleteFIDO2PasskeyPage,
]);

const DisplayReleaseTag = () => {
  const { releaseTag } = config as { releaseTag?: string };

  if (!releaseTag) {
    return null;
  }

  return (
    <GcdsContainer size="lg" className="gcds-content version-text">
      <GcdsText marginBottom="0">Version: {releaseTag}</GcdsText>
    </GcdsContainer>
  );
};

export default function RootLayout() {
  const { pathname } = useLocation();
  const matches = useMatches();
  const { state: languageState } = useLanguage();
  const { language } = languageState;

  // Derive language from URL path first (source of truth during navigation),
  // falling back to context language which may be stale on initial render.
  const urlLang = pathname.split("/").filter(Boolean)[0]?.toLowerCase();
  const effectiveLang =
    urlLang === "en" || urlLang === "fr" ? urlLang : (language ?? undefined);
  const { langHref, currentLang } = getLangValues(effectiveLang, pathname);
  const rpParams = useRelyingPartyAnalyticsParams();

  // Synchronously update <html lang> so GCDS web components pick up the
  // correct language via their assignLanguage() DOM walk on first render.
  document.documentElement.lang = currentLang;

  const pageId = [...matches]
    .reverse()
    .map((match) => (match.handle as { id?: string } | undefined)?.id)
    .find(Boolean);

  useEffect(() => {
    setAnalyticsContext(rpParams);
  }, [rpParams]);

  useEffect(() => {
    if (pageId && WIZARD_TRACKED_PAGE_IDS.has(pageId)) {
      return;
    }

    trackPage(pathname, pageId, rpParams);
  }, [pathname, pageId, rpParams]);

  return (
    <div className="mainBody">
      <Header langHref={langHref} currentLang={currentLang} />
      <GcdsContainer className="gcds-page">
        <GcdsContainer size="lg" className="gcds-content" id="main-content">
          <Outlet />
        </GcdsContainer>
        <DisplayReleaseTag />
      </GcdsContainer>

      <Footer currentLang={currentLang} />
    </div>
  );
}
