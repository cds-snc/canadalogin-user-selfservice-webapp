import React from "react";
import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsNotice,
    GcdsButton,
    GcdsGrid,
    GcdsFieldset,
    // GcdsRadioGroup,
    GcdsRadios,
    GcdsDetails,
    GcdsLink
} from "@cdssnc/gcds-components-react";

import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions";
import { PAGES, NAVIGATION_LINKS, CONTEXT_ACTIONS, AVAILABLE_LANGUAGES } from "../../utils/constants";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser";
import { authService } from "../../services/authService.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function EditLanguagePreferences() {
    const { language } = useParams();
    const { state, dispatch } = useUser();

    const pageContentJson = getPageContent(language, PAGES.editLanguagePreferences);
    const navigateHelper = useNavigateHelper();
    const successPage = `/${language}${NAVIGATION_LINKS.profileYouMayUpdateName}`;
    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

    const saveUpdatedProfileData = async () => {
        try {
            const response = await authService.update_my_user_profile(state.editProfile);
            if (response) {
                dispatch({ type: CONTEXT_ACTIONS.updated_profile_success, payload: response.data });
                return true;
            }
            else {
                // Todo: handle errors
            }
        } catch (err) {
            // Todo: handle errors
            console.log(err);
        }
    };

    console.log("state", state)

    const profilePreferredLanguage = state?.userProfile?.preferredLanguage;

    const englistSelection = { "label": pageContentJson['13'], "id": AVAILABLE_LANGUAGES.profileEn, "value": AVAILABLE_LANGUAGES.profileEn, "checked": profilePreferredLanguage === AVAILABLE_LANGUAGES.profileEn };
    const frenchSelection = { "label": pageContentJson['14'], "id": AVAILABLE_LANGUAGES.profileFr, "value": AVAILABLE_LANGUAGES.profileFr, "checked": profilePreferredLanguage === AVAILABLE_LANGUAGES.profileEn };


    const languageOptions = [englistSelection, frenchSelection]

    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">{pageContentJson["1"]}</GcdsHeading>
            <GcdsText>
                {pageContentJson["2"]}
            </GcdsText>


            <GcdsGrid columns="1fr">
                <GcdsDetails detailsTitle={pageContentJson['4']} >

                    <GcdsText><span>{pageContentJson['8']}</span></GcdsText>
                    <ul style={{ margin: 0 }}>
                        <li>{pageContentJson['9']}</li>
                    </ul>
                    <GcdsText>{pageContentJson['10']}</GcdsText>
                    <GcdsText>
                        {pageContentJson['11']}&nbsp;
                        <GcdsLink href="https://accounts.gc.ca/directory">
                            {pageContentJson['12']}
                        </GcdsLink>.
                    </GcdsText>
                </GcdsDetails>

            </GcdsGrid>



            <GcdsContainer marginTop="100">
                <GcdsRadios
                    name="radio"
                    legend={pageContentJson['3']}
                    options={languageOptions}
                    lang={language}
                >
                </GcdsRadios>

            </GcdsContainer>



            <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
                <GcdsButton onGcdsClick={(ev) => {
                    ev.preventDefault();
                    navigateHelper(backtoProfile)
                }}>
                    {pageContentJson["15"]}
                </GcdsButton>
                <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
                    ev.preventDefault();
                    navigateHelper(backtoProfile)
                }}>
                    {pageContentJson["16"]}
                </GcdsButton>
            </GcdsGrid>
        </GcdsContainer>
    );
}
