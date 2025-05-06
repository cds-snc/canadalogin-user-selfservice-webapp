import {GcdsHeading, GcdsLink, GcdsText} from "@cdssnc/gcds-components-react";
import {getLanguage, getPageContent} from "../../utils/functions";
import {NAVIGATION_LINKS} from "../../utils/constants.jsx";
import {GA_CATEGORIES, GA_ACTIONS, GA_LABELS} from "../../utils/constants.jsx";
import { trackEvent } from "../../utils/gatag.jsx";

export default function FirstTimeGc({currentLang})
{
    const pageContentJson = getPageContent(currentLang, "FirstTimeGc");
    const language = getLanguage(currentLang);

    return(
        <GcdsHeading tag="h2">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink href={`/${language}${NAVIGATION_LINKS.privacy}`}
                onClick={() => trackEvent({
                    category: GA_CATEGORIES.signup,
                    action: GA_ACTIONS.clickFirstTimeGc,
                    label: GA_LABELS.link
                  })} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}