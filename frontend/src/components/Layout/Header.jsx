import { useNavigate } from "react-router";
import {
  GcdsContainer,
  GcdsHeader,
  GcdsLangToggle,
} from "@cdssnc/gcds-components-react";

import TopNav from "./TopNav";
import Breadcrumbs from "./Breadcrumbs";

export default function Header({ langHref, currentLang }) {
  const navigate = useNavigate();

  return (
    <GcdsContainer className="gcds-header">
      <GcdsHeader
        langHref={langHref}
        skipToHref="#main-content"
        signature-variant={"colour"}
        lang={currentLang}
      >
        <TopNav currentLang={currentLang} />
        <GcdsLangToggle
          slot="toggle"
          onGcdsClick={(ev) => {
            ev.preventDefault();
            navigate(ev.detail);
          }}
          href={langHref}
        />
        <Breadcrumbs />
      </GcdsHeader>
    </GcdsContainer>
  );
}
