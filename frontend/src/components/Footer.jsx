import {GcdsFooter} from "@cdssnc/gcds-components-react";
import {getFooter, getLanguage} from '../common/functions'


export default function Footer(){
    const currentLang = getLanguage();

    return  (
        <GcdsFooter display="compact" subLinks={getFooter(currentLang)} ></GcdsFooter>
    );
}