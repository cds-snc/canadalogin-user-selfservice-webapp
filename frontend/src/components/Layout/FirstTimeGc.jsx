import { GcdsHeading, GcdsLink, GcdsText } from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../utils/functions";
import { GA_CATEGORIES, GA_ACTIONS, GA_LABELS } from "../../utils/constants.jsx";
import { trackEvent } from "../../utils/gatag.jsx";

export default function FirstTimeGc({ currentLang }) {
    const pageContentJson = getPageContent(currentLang, "FirstTimeGc");

    return (
        <GcdsHeading tag="h2">
            {pageContentJson['1']}
            <GcdsText marginTop="200" marginBottom="0">
                <GcdsLink href={"#"}
                    onClick={() => trackEvent({
                        category: GA_CATEGORIES.onboarding,
                        action: GA_ACTIONS.clickFirstTimeGc,
                        label: GA_LABELS.link
                    })} >
                    {pageContentJson['2']}
                </GcdsLink>
            </GcdsText>
        </GcdsHeading>
    )
}