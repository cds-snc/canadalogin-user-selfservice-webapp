import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsGrid,
    GcdsErrorSummary,
    GcdsCard
} from "@cdssnc/gcds-components-react";
import {
    PAGES,
} from "../../utils/constants";
import {useUser} from "../Providers/useUser";
import {useParams} from "react-router";
import {useError} from "../../hooks/useError";
import {getPageContent} from "../../utils/functions.jsx";
import { useContext } from "react";
import UserContext from "../Providers/UserContext";


export default function ManageDashboard() {
    const {state} = useUser();
    const {language} = useParams();
    const {setError, getError, hasErrors, clearAllErrors} = useError(language);
    const error = getError("#dashboard");
    const pageContent = getPageContent(language, PAGES.manageHome);
    const { userData } = useContext(UserContext);
    const userName = userData?.name || "<Name of User" ;
    const services = state.userData?.services || []; // Example: Fetch user services from state

    return (
        <GcdsContainer>

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
                <GcdsHeading tag="h1" marginTop='250'>
                    {pageContent['1']} {userName}
                </GcdsHeading>
            </GcdsContainer>

            {/* Dashboard Section */}


            {/* Action Cards */}
            <GcdsGrid columns="repeat(auto-fit, minmax(100px, 290px))">
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
                </GcdsCard>
                </p>

            </GcdsGrid>

        </GcdsContainer>
    );
}