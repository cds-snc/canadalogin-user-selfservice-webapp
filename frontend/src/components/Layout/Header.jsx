import {GcdsHeader} from "@cdssnc/gcds-components-react";

export default function Header({langHref,currentLang}){
    return  (
        <GcdsHeader langHref={`${langHref}`} skipToHref="#" signature-variant={"colour"} lang={currentLang}></GcdsHeader>
    );
}
