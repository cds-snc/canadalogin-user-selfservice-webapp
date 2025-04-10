import {GcdsBreadcrumbs, GcdsBreadcrumbsItem, GcdsContainer, GcdsHeader, GcdsText} from "@cdssnc/gcds-components-react";

export default function Header({langHref,currentLang, service}){
    const redirect = '"/'+{currentLang}+'/redirecttorp"';
    return  (
        <GcdsContainer className="gcds-header">
            <GcdsHeader langHref={langHref} skipToHref="#" signature-variant={"colour"} lang={currentLang} >
                <GcdsText slot="breadcrumb">
                    <GcdsBreadcrumbs hideCanadaLink>
                        <GcdsBreadcrumbsItem href={redirect} >{service}</GcdsBreadcrumbsItem>
                    </GcdsBreadcrumbs>
                </GcdsText>
            </GcdsHeader>
        </GcdsContainer>
    );
}
