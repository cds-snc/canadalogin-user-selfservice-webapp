import { useNavigate } from "react-router";
import {
  GcdsContainer,
  GcdsHeader,
  GcdsLangToggle,
} from "@cdssnc/gcds-components-react";

import TopNav from "./TopNav";
import Breadcrumbs from "./Breadcrumbs";

interface HeaderProps {
  langHref: string;
  currentLang: string;
}

type LanguageToggleEvent = CustomEvent<string> & {
  preventDefault: () => void;
};

export default function Header({ langHref, currentLang }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <GcdsContainer className="gcds-header">
      <GcdsHeader
        lang={currentLang}
        langHref={langHref}
        skipToHref="#main-content"
        signature-variant={"colour"}
      >
        <TopNav currentLang={currentLang} />
        <GcdsLangToggle
          slot="toggle"
          href={langHref}
          lang={currentLang}
          onGcdsClick={(ev: LanguageToggleEvent) => {
            ev.preventDefault();
            navigate(ev.detail);
          }}
        />
        <Breadcrumbs />
      </GcdsHeader>
    </GcdsContainer>
  );
}
