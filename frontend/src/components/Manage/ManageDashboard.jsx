import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsLink,
    GcdsButton,
    GcdsErrorSummary,
    GcdsNotice,
} from "@cdssnc/gcds-components-react";
import {useUser} from "../Providers/useUser";
import {useParams} from "react-router";
import {PAGES} from "../../utils/constants";
import {useError} from "../../hooks/useError";

export default function ManageDashboard() {
    const {state} = useUser();
    const {language} = useParams();
    const {setError, getError, hasErrors, clearAllErrors} = useError(language);
    const error = getError("#dashboard");

    const services = state.userData?.services || []; // Example: Fetch user services from state

    return (
        <GcdsContainer>
            {/* Notice Section */}
            <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle="Manage Dashboard">
                Welcome to your account management page.
            </GcdsNotice>
            <br />

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
                    Welcome, {state.userData?.name || "User"}
                </GcdsHeading>
                <GcdsText>
                    Manage your account and services below.
                </GcdsText>
            </GcdsContainer>

            {/* Services Section */}
            <GcdsContainer className="gcds-services">
                <GcdsHeading tag="h2">Your Services</GcdsHeading>
                {services.length > 0 ? (
                    services.map((service, index) => (
                        <GcdsContainer key={index} className="gcds-service-item">
                            <GcdsText>{service.name}</GcdsText>
                            <GcdsLink href={service.link}>Manage</GcdsLink>
                        </GcdsContainer>
                    ))
                ) : (
                    <GcdsText>No services available.</GcdsText>
                )}
            </GcdsContainer>

            {/* Action Buttons */}
            <GcdsContainer className="gcds-actions">
                <GcdsButton type="button" onClick={() => console.log("Add Service")}>
                    Add a Service
                </GcdsButton>
                <GcdsButton type="button" onClick={() => console.log("Sign Out")}>
                    Sign Out
                </GcdsButton>
            </GcdsContainer>
        </GcdsContainer>
    );
}