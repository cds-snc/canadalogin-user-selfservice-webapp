import {GcdsContainer, GcdsFooter} from "@cdssnc/gcds-components-react";
import {getFooter} from "../../utils/functions";

export default function Footer({currentLang}){

    return  (
        <GcdsContainer>
            <GcdsFooter display="compact" subLinks={getFooter(currentLang)} data-testid="gcds-footer"/>
        </GcdsContainer>
    );
}