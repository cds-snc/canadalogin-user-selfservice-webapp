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

import TopNav from "./TopNav";
import Breadcrumbs from "./Breadcrumbs";

export default function Header({ langHref, currentLang }) {
  return (
    <GcdsContainer className="gcds-header">
      <GcdsHeader
        langHref={langHref}
        skipToHref="#"
        signature-variant={"colour"}
        lang={currentLang}
      >
        <TopNav currentLang={currentLang} />
        <Breadcrumbs />
      </GcdsHeader>
    </GcdsContainer>
  );
}
