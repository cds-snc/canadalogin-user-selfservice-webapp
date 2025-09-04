import React, { useEffect } from "react";
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
import { userProfileDispatch, useCancelLanguageEditing } from "../../utils/userProfileDispatch.jsx";

import { PAGES, NAVIGATION_LINKS, PROFILE_LANGUAGES } from "../../utils/constants";
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser";

export default function EditLanguagePreferences() {
    const { language } = useParams();
    const navigateHelper = useNavigateHelper();

    const { state, dispatch } = useUser();
    const { userProfile } = state;
    const { cloneUserProfile, updateClonedProfile, setOriginalLanguageBeforeEdit, setCancelProfileEditing } = userProfileDispatch(dispatch);
    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;
    const { handleCancel } = useCancelLanguageEditing(backtoProfile);
    const pageContentJson = getPageContent(language, PAGES.editLanguagePreferences);
    const areYouSureEditYourLanguage = `/${language}${NAVIGATION_LINKS.areYouSureEditYourLanguage}`


    const profilePreferredLanguage = userProfile?.preferredLanguage;

    const englistSelection = { "label": pageContentJson['13'], "id": PROFILE_LANGUAGES.en, "value": PROFILE_LANGUAGES.en, "checked": profilePreferredLanguage === PROFILE_LANGUAGES.en };
    const frenchSelection = { "label": pageContentJson['14'], "id": PROFILE_LANGUAGES.fr, "value": PROFILE_LANGUAGES.fr, "checked": profilePreferredLanguage === PROFILE_LANGUAGES.fr };


    const languageOptions = [englistSelection, frenchSelection]

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        console.log(name)
        console.log(value)
        updateClonedProfile({ preferredLanguage: value });
    };

    const onSubmitHandler = (event) => {
        event.preventDefault()
        navigateHelper(areYouSureEditYourLanguage);
    }


    useEffect(() => {
        cloneUserProfile();
        setOriginalLanguageBeforeEdit(language);
        return () => {
            setCancelProfileEditing(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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
                <GcdsButton buttonRole="secondary" onGcdsClick={handleCancel}>
                    {pageContentJson["16"]}
                </GcdsButton>
            </GcdsGrid>
        </GcdsContainer>
    );
}
