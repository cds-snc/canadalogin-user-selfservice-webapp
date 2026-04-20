import { useEffect } from "react";
import { Outlet, useLocation, useMatches } from "react-router";
import { useLanguage } from "../Providers/LanguageProvider";
import { getLangValues } from "../../utils/functions";
import { trackPage } from "../../utils/gatag";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import config from "../../config";

import { GcdsContainer, GcdsText } from "@gcds-core/components-react";

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
  const { langHref, currentLang } = getLangValues(
    language ?? undefined,
    pathname,
  );
  const pageId = [...matches]
    .reverse()
    .map((match) => (match.handle as { id?: string } | undefined)?.id)
    .find(Boolean);

  useEffect(() => {
    trackPage(pathname, pageId);
  }, [pathname, pageId]);

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
