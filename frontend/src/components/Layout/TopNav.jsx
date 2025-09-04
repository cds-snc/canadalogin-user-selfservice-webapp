import { GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsContainer, GcdsHeader, GcdsNavGroup, GcdsNavLink, GcdsText, GcdsTopNav } from "@cdssnc/gcds-components-react";
import { useBreakpoints } from "../../hooks/useBreakpoints";
import { getPageContent } from "../../utils/functions.jsx";
import { useUser } from "../Providers/useUser";

export default function TopNav({ currentLang }) {
    const pageContentJson = getPageContent(currentLang, "TopNavBar");
    const { state } = useUser();

    const relyingPartyLinkName = state.relyingPartyInfo?.linkName;
    const relyingPartyUrl = state.relyingPartyInfo?.url;
    const shouldRenderRelyingPartyLink = relyingPartyLinkName && relyingPartyUrl;

    const { mobile, tablet } = useBreakpoints();

    const navLinksJsx = (<>
        <GcdsNavLink href={`/${currentLang}/`}>{pageContentJson["3"]}</GcdsNavLink>
        <GcdsNavLink href={`/${currentLang}/profilehome`}>{pageContentJson["4"]}</GcdsNavLink>
        <GcdsNavLink href={`/${currentLang}/securitysettings`}>{pageContentJson["5"]}</GcdsNavLink>
        {shouldRenderRelyingPartyLink && <GcdsNavLink href={relyingPartyUrl}>{pageContentJson["6"] + relyingPartyLinkName}</GcdsNavLink>}
        <GcdsNavLink href="#">{pageContentJson["7"]}</GcdsNavLink>
    </>)

    if(mobile || tablet) {
        return (<>
            <GcdsContainer slot="menu">
                <div className="gcds-top-nav-container">
                    <div className="gcds-top-nav-width-spacer">
                        <GcdsText marginBottom="0">
                            <strong>
                                {pageContentJson["1"]}
                            </strong>
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
        </>)
    }

    return (
        <GcdsTopNav
            slot="menu"
            label="Top navigation"
            alignment="right"
            className="gcds-top-nav"
        >
            <GcdsNavLink href="#" slot="home">
                {pageContentJson["1"]}
            </GcdsNavLink>
            <GcdsNavGroup open-trigger="Menu" menu-label="Menu">
                {navLinksJsx}
            </GcdsNavGroup>
        </GcdsTopNav>
    )
}
