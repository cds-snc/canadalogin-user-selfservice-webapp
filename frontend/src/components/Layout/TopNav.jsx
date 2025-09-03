import { GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsContainer, GcdsHeader, GcdsNavGroup, GcdsNavLink, GcdsText, GcdsTopNav } from "@cdssnc/gcds-components-react";
import { useIsMobile } from "../../hooks/useIsMobile";

export default function TopNav({ currentLang }) {
    console.log(currentLang)

    const isMobile = useIsMobile();

    if(isMobile) {
        return (<>
            <GcdsContainer slot="menu">
                <div className="gcds-nav-name-container">
                    <div className="gcds-nav-width-spacer">
                        <GcdsText marginBottom="0"><strong>GC Sign in</strong></GcdsText>
                    </div>
                </div>
            </GcdsContainer>
            <GcdsTopNav
                slot="menu"
                label="Top navigation"
                alignment="right"
                className="gcds-top-nav"
            >
                <GcdsNavLink href="#">GC Sign in account</GcdsNavLink>
                <GcdsNavLink href="#">Personal information</GcdsNavLink>
                <GcdsNavLink href="#">Security settings</GcdsNavLink>
                <GcdsNavLink href="#">Return to foo.com</GcdsNavLink>
                <GcdsNavLink href="#">Sign out</GcdsNavLink>
            </GcdsTopNav>
        </>)
    }

    // Our desktop design doesn't align with the design system, so we've
    // implemented our own implementation here.
    return (
        <GcdsContainer className="gcds-nav-name-container" slot="menu">
            <div className="gcds-nav-name-container">
            <div className="gcds-nav-width-spacer">
            <GcdsText className="gcds-nav-name-text" marginBottom="0"><strong>GC Sign in</strong></GcdsText>
            </div>
            </div>
        </GcdsContainer>
    )
}