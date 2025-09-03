import { GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsContainer, GcdsHeader, GcdsNavGroup, GcdsNavLink, GcdsText, GcdsTopNav } from "@cdssnc/gcds-components-react";
import { useBreakpoints } from "../../hooks/useBreakpoints";

export default function TopNav({ currentLang }) {
    console.log(currentLang)

    const { mobile, tablet } = useBreakpoints();

    // Note for nat:
    // If we do end up using GcdsTopNav in the desktop case, we can pull the GcdsTopNav stuff into some shared thing.


    if(mobile || tablet) {
        return (<>
            <GcdsContainer slot="menu">
                <div className="gcds-top-nav-container">
                    <div className="gcds-top-nav-width-spacer">
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
        <GcdsTopNav
                slot="menu"
                label="Top navigation"
                alignment="right"
                className="gcds-top-nav"
            >
                <GcdsNavLink href="#" slot="home">GC Sign in</GcdsNavLink>
                <GcdsNavGroup open-trigger="Menu" menu-label="Menu">
                    <GcdsNavLink href="#">GC Sign in account</GcdsNavLink>
                    <GcdsNavLink href="#">Personal information</GcdsNavLink>
                    <GcdsNavLink href="#">Security settings</GcdsNavLink>
                    <GcdsNavLink href="#">Return to foo.com</GcdsNavLink>
                    <GcdsNavLink href="#">Sign out</GcdsNavLink>
                </GcdsNavGroup>
            </GcdsTopNav>
    )
}