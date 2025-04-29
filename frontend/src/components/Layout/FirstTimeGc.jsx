import {GcdsHeading, GcdsLink, GcdsText} from "@cdssnc/gcds-components-react";
import {getLanguage, getPageContent} from "../../utils/functions";
import {NAVIGATION_LINKS} from "../../utils/constants.jsx";
import ReactGA from "react-ga4";
import {GA_CATEGORIES, GA_ACTIONS, GA_LABELS} from "../../utils/constants.jsx";

export default function FirstTimeGc({currentLang})
{
    const pageContentJson = getPageContent(currentLang, "FirstTimeGc");
    const language = getLanguage(currentLang);
    return(
        <GcdsHeading tag="h2">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink href={`/${language}${NAVIGATION_LINKS.privacy}`}
                onClick={() => {
                    ReactGA.event({
                      category: GA_CATEGORIES.ONBOARDING,
                      action: GA_ACTIONS.CLICK_FIRST_TIME_GC,
                      label: GA_LABELS.LINK
                    });
                  }} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}