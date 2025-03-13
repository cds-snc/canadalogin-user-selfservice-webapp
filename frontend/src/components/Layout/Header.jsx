import {GcdsContainer, GcdsHeader} from "@cdssnc/gcds-components-react";

export default function Header({langHref,currentLang}){
    return  (
        <GcdsContainer className="gcds-header">
            <GcdsHeader langHref={`${langHref}`} skipToHref="#" signature-variant={"colour"} lang={currentLang} />
        </GcdsContainer>
    );
}
