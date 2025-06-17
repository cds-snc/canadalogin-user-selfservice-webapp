import { GcdsHeading, GcdsLink, GcdsText } from "@cdssnc/gcds-components-react";
import { useNavigate } from "react-router";
import { getLanguage, getPageContent } from "../../utils/functions";
import { NAVIGATION_LINKS } from "../../utils/constants.jsx";
import { GA_CATEGORIES, GA_ACTIONS, GA_LABELS } from "../../utils/constants.jsx";
import { trackEvent } from "../../utils/gatag.jsx";

export default function FirstTimeGc({ currentLang }) {
    const pageContentJson = getPageContent(currentLang, "FirstTimeGc");
    const language = getLanguage(currentLang);
    const navigate = useNavigate();

    return (
        <GcdsHeading tag="h2">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink
                    onClick={() => {
                        trackEvent({
                            category: GA_CATEGORIES.onboarding,
                            action: GA_ACTIONS.clickFirstTimeGc,
                            label: GA_LABELS.link
                        });
                        navigate(`/${language}${NAVIGATION_LINKS.privacy}`);
                    }} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading >
    )
}