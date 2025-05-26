import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsGrid,
    GcdsButton,
    GcdsErrorSummary,
    GcdsCard
} from "@cdssnc/gcds-components-react";
import {
    AVAILABLE_LANGUAGES,
    PAGES,
    SERVICES
} from "../../utils/constants";
import {useUser} from "../Providers/useUser";
import {useParams} from "react-router";
import {useError} from "../../hooks/useError";
import {getPageContent} from "../../utils/functions.jsx";

export default function ManageDashboard() {
    const {state} = useUser();
    const {language} = useParams();
    const {setError, getError, hasErrors, clearAllErrors} = useError(language);
    const error = getError("#dashboard");
    const pageContentJson = getPageContent(language, PAGES.manage);

    const services = state.userData?.services || []; // Example: Fetch user services from state

    return (
        <GcdsContainer>
                {/*{pageContentJson['1']}*/}
                <GcdsText marginTop="150" marginBottom="0">
                    {/*{pageContentJson['2']}*/}
                    <strong>
                        {/*{language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':''}*/}
                        {/*{` ${SERVICES[0].title}`}{language===AVAILABLE_LANGUAGES.en?' '+pageContentJson['3']:''}*/}
                    </strong>
                </GcdsText>


            {/* Error Summary */}
            {hasErrors() && (
                <GcdsErrorSummary
                    data-testid="errorSummary"
                    errorLinks={`{"#dashboard": "${error.errorMsg}"}`}
                    heading={error.heading}
                />
            )}

            {/* Welcome Section */}
            <GcdsContainer className="gcds-welcome">
                <GcdsHeading tag="h1" className="gcds-heading">
                    Welcome,  {state.userData?.name || "<Name"} of User >
                </GcdsHeading>
            </GcdsContainer>

            {/* Dashboard Section */}


            {/* Action Cards */}
            <GcdsGrid columns="repeat(auto-fit, minmax(100px, 200px))">
                <p><GcdsCard
                    cardTitle="Personal Information"
                    href="#"
                    cardTitleTag="h3"
                >
                </GcdsCard>
                </p>
                <p>
                    <GcdsCard
                    cardTitle="Security settings"
                    href="#"
                    cardTitleTag="h3"
                >
                </GcdsCard></p>

            </GcdsGrid>

        </GcdsContainer>
    );
}