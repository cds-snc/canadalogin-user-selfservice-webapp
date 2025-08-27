import { useState, useEffect } from "react";
import { useParams } from "react-router";

import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsNotice,
    GcdsButton, GcdsGrid, GcdsLink
} from "@cdssnc/gcds-components-react";
import { getPageContent } from "../../../utils/functions";
import { PAGES } from "../../../utils/constants";
import { redirectToLogin } from "../../../utils/redirect.jsx";
import { useNavigateHelper } from "../../../hooks/useNavigate.tsx";

export default function YouMayUpdateEmailAtOtherPlaces() {
    const { language } = useParams();
    const [time, setTime] = useState(5);
    const navigateHelper = useNavigateHelper();


    const pageContentJson = getPageContent(language, PAGES.passwordChangedConfirmation);
    const backtoProfile = `/${language}`;

    useEffect(() => {
        if (time <= 0)
            return;

        const timer = setTimeout(() => {
            setTime((prevTime) => prevTime - 1);
        }, 1000);

        return () => clearTimeout(timer);

    }, [time]);

    useEffect(() => {
        if (time <= 0) {
            redirectToLogin();
            return;
        }
    }, [time]);


    return (
        <GcdsContainer>
            <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle=' '>
                <GcdsText>{pageContentJson["1"]}</GcdsText>
            </GcdsNotice>
            <br />&nbsp;
            <GcdsHeading tag="h1">{pageContentJson["2"]}</GcdsHeading>
            <GcdsText>{pageContentJson["3"]}</GcdsText>
            <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
                <GcdsButton style={{ width: 'fit-content' }} onGcdsClick={(ev) => {
                    ev.preventDefault();
                    navigateHelper(backtoProfile)
                }}>
                    {pageContentJson["4"]}
                </GcdsButton>
            </GcdsGrid>
        </GcdsContainer>
    );
}
