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
    const pageContent = getPageContent(language, PAGES.manageDashboard);
    const { userData } = useContext(UserContext);
    const firstName = userData?.firstName?.trim();
    const userName = firstName ? firstName : userData?.lastName || "<Name of User";

    // const userName = userData?.name || "<Name of User" ;
    // const services = state.userData?.services || []; // Example: Fetch user services from state

    return (
        <GcdsContainer className="gcds-container">

            {/* Error Summary */}
            {hasErrors() && (
                <GcdsErrorSummary
                    data-testid="errorSummary"
                    errorLinks={`{"#dashboard": "${error.errorMsg}"}`}
                    heading={error.heading}
                />
            )}

                <GcdsHeading tag="h1" marginTop='250'>
                    {pageContent['1']} {userName}
                </GcdsHeading>


            {/* Action Cards */}
            <gcds-grid columns="repeat(auto-fit, minmax(200px, 450px))">
                <p><gcds-card card-title="Trouble signing up" href="{{ links.troublesigningup }}" description="Can’t verify your email? Not sure what makes a strong password? We’ll help you resolve account-creation issues." card-title-tag="h4"></gcds-card></p>
                <p><gcds-card card-title="Trouble signing in" href="{{ links.troublesigningin }}" description="Forgot your password? Locked out of your account? We’ll help you resolve access issues." card-title-tag="h4"></gcds-card></p>
                <p><gcds-card card-title="Managing your GC Sign in account" href="{{ links.manageyouraccount }}" description="Change your account settings including your password, phone number, email and more." card-title-tag="h4"></gcds-card></p>
            </gcds-grid>
                {/*<p>*/}
                {/*<GcdsCard*/}
                {/*    cardTitle="Personal Information"*/}
                {/*    href="#"*/}
                {/*    cardTitleTag="h3"*/}
                {/*>*/}
                {/*</GcdsCard>*/}
                {/*</p>*/}
                {/*<p>*/}
                {/*<GcdsCard*/}
                {/*    cardTitle="Security settings"*/}
                {/*    href="#"*/}
                {/*    cardTitleTag="h3"*/}
                {/*>*/}
                {/*</GcdsCard>*/}
                {/*</p>*/}

        </GcdsContainer>
    );
}


