import React from 'react';
import {
    GcdsContainer,
    GcdsHeading,
    GcdsGrid,
    GcdsErrorSummary,
    GcdsCard
} from "@cdssnc/gcds-components-react";
import {
    PAGES,
} from "../../utils/constants";
import {useParams} from "react-router";
import {useError} from "../../hooks/useError";
import {getPageContent} from "../../utils/functions.jsx";
import { useContext } from "react";
import UserContext from "../Providers/UserContext";


export default function ManageDashboard() {
    const {language} = useParams();
    const { getError, hasErrors} = useError(language);
    const error = getError("#dashboard");
    const pageContent = getPageContent(language, PAGES.ManageDashboard);
    const { userData } = useContext(UserContext);
    const firstName = userData?.firstName?.trim();
    const userName = firstName ? firstName : userData?.lastName || "<Name of User";

    // const userName = userData?.name || "<Name of User" ;
    // const services = state.userData?.services || []; // Example: Fetch user services from state

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
                <GcdsCard
                    cardTitle="Personal Information"
                    href="#"
                    cardTitleTag="h3"
                >
                </GcdsCard>
                <GcdsCard
                    cardTitle="Security settings"
                    href="#"
                    cardTitleTag="h3"
                >
                </GcdsCard>
            </GcdsGrid>

        </GcdsContainer>
    );
}


