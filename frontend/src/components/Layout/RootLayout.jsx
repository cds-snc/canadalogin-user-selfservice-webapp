import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { useLanguage } from "../Providers/LanguageProvider";
import { getLangValues } from "../../utils/functions";
import { trackPage } from "../../utils/gatag.jsx";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";

import { GcdsContainer } from "@cdssnc/gcds-components-react";

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
        <GcdsContainer size="lg" className="gcds-content">
            <Outlet />
        </GcdsContainer>
      </GcdsContainer>

      <Footer currentLang={language} />
    </div>
  );
}
