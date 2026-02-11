import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useLanguage } from "../Providers/LanguageProvider";
import { getLangValues } from "../../utils/functions";
import { trackPage } from "../../utils/gatag";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import config from "../../config";

import { GcdsContainer, GcdsText } from "@cdssnc/gcds-components-react";

const DisplayReleaseTag = () => {
  const { releaseTag } = config;

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
  const { state: languageState } = useLanguage();
  const { language } = languageState;
  const { langHref } = getLangValues(language, pathname);
  useEffect(() => {
    trackPage(pathname);
  }, [pathname]);

  return (
    <div className="mainBody">
      <Header langHref={langHref} currentLang={language} />
      <GcdsContainer className="gcds-page">
        <GcdsContainer size="lg" className="gcds-content" id="main-content">
          <Outlet />
        </GcdsContainer>
        <DisplayReleaseTag />
      </GcdsContainer>

      <Footer currentLang={language} />
    </div>
  );
}
