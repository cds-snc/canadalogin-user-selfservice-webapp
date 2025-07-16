import React, { useEffect, useState } from "react";
import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsButton,
    GcdsGrid,
    GcdsRadios,
    GcdsDetails,
    GcdsLink
} from "@cdssnc/gcds-components-react";

import { useParams } from "react-router";

import { getPageContent } from "../../utils/functions";
import { PAGES, NAVIGATION_LINKS, CONTEXT_ACTIONS, PROFILE_LANGUAGES } from "../../utils/constants";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser";

export default function EditLanguagePreferences() {
    const { language } = useParams();
    const { state, dispatch } = useUser();
    const [editProfile, setEditProfile] = useState({ ...state.editProfile });

    const pageContentJson = getPageContent(language, PAGES.editLanguagePreferences);
    const navigateHelper = useNavigateHelper();
    const areYouSureEditYourLanguage = `/${language}${NAVIGATION_LINKS.areYouSureEditYourLanguage}`

    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;

    const profilePreferredLanguage = state?.userProfile?.preferredLanguage;

    const englistSelection = { "label": pageContentJson['13'], "id": PROFILE_LANGUAGES.en, "value": PROFILE_LANGUAGES.en, "checked": profilePreferredLanguage === PROFILE_LANGUAGES.en };
    const frenchSelection = { "label": pageContentJson['14'], "id": PROFILE_LANGUAGES.fr, "value": PROFILE_LANGUAGES.fr, "checked": profilePreferredLanguage === PROFILE_LANGUAGES.fr };


    const languageOptions = [englistSelection, frenchSelection]



    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        console.log(name)
        console.log(value)
        setEditProfile(prev => ({
            ...prev,
            preferredLanguage: value,
        }));
    };

    const onSubmitHandler = (event) => {
        event.preventDefault()
        dispatch({
            type: CONTEXT_ACTIONS.update_profile,
            payload: {
                preferredLanguage: editProfile.preferredLanguage
            }
        });
        navigateHelper(areYouSureEditYourLanguage);
    }

    useEffect(() => {
        dispatch({ type: CONTEXT_ACTIONS.clone_profile, payload: null });
    }, [dispatch, state.userProfile]);

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
                    onChange={handleProfileChange}
                >
                </GcdsRadios>

            </GcdsContainer>



            <GcdsGrid columns="auto auto" gap="1rem" align-items="center">
                <GcdsButton onGcdsClick={(ev) => {
                    ev.preventDefault();
                    onSubmitHandler(ev);
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
