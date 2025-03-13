import {GcdsHeading, GcdsLink, GcdsText} from "@cdssnc/gcds-components-react";
import {getPageContent} from "../../utils/functions";
import {NAVIGATION_LINKS} from "../../utils/constants.jsx";



export default function FirstTimeGc({currentLang})
{
    const pageContentJson = getPageContent(currentLang, "FirstTimeGc");

    return(
        <GcdsHeading tag="h2">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}