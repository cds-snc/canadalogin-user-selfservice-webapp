import {GcdsHeader} from "@cdssnc/gcds-components-react";
import {getLangValues} from '../common/functions'

export default function Header(){
    const {langHref, currentLang} = getLangValues();

    return  (
        <GcdsHeader langHref={`${langHref}`} skipToHref="#" signature-variant={"colour"} lang={currentLang}></GcdsHeader>
    );
}
