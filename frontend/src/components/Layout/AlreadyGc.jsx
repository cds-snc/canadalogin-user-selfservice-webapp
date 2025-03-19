import {GcdsHeading, GcdsLink, GcdsText} from "@cdssnc/gcds-components-react";
import {getPageContent} from "../../utils/functions";



export default function AlreadyGc({currentLang})
{
    const pageContentJson = getPageContent(currentLang, "AlreadyGc");

    return(
        <GcdsHeading tag="h3">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink href={`/${currentLang}`} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}