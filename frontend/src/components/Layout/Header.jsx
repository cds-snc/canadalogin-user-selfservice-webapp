import { GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsContainer, GcdsHeader, GcdsNavGroup, GcdsNavLink, GcdsText, GcdsTopNav } from "@cdssnc/gcds-components-react";
import { useUser } from "../Providers/useUser";
import TopNav from "./TopNav";

export default function Header({ langHref, currentLang }) {
    const { state } = useUser();

    const redirect = `${state.relyingPartyInfo?.url}`;
    return (
        <GcdsContainer className="gcds-header">
            <GcdsHeader langHref={langHref} skipToHref="#" signature-variant={"colour"} lang={currentLang} >
                <TopNav currentLang={currentLang} />
                <GcdsText slot="breadcrumb">
                    <GcdsBreadcrumbs hideCanadaLink>
                        <GcdsBreadcrumbsItem href={redirect} >{state.relyingPartyInfo?.linkName || ""}</GcdsBreadcrumbsItem>
                    </GcdsBreadcrumbs>
                </GcdsText>
            </GcdsHeader>
        </GcdsContainer>
    );
}
