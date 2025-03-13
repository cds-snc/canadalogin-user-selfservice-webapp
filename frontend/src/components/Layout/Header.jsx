import {GcdsContainer, GcdsHeader} from "@cdssnc/gcds-components-react";

export default function Header({langHref,currentLang}){
    return  (
        <GcdsContainer>
            <GcdsHeader langHref={`${langHref}`} skipToHref="#" signature-variant={"colour"} lang={currentLang} />
        </GcdsContainer>
    );
}
