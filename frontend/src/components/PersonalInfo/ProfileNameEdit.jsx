import { useState, useEffect } from 'react';
import {
    GcdsButton,
    GcdsContainer,
    GcdsHeading,
    GcdsInput,
    GcdsDetails,
    GcdsText, GcdsLink
} from '@cdssnc/gcds-components-react';
import { useParams } from 'react-router';
import { getPageContent } from '../../utils/functions';
import { userProfileDispatch } from "../../utils/userProfileDispatch.jsx";
import { PAGES, NAVIGATION_LINKS, CONTEXT_ACTIONS } from '../../utils/constants';
import SubmitButton from '../Layout/SubmitButton';
import { useNavigateHelper } from "../../hooks/useNavigate.tsx";
import { useUser } from "../Providers/useUser";

export default function ProfileNameEdit() {
    const { language } = useParams();
    const { state, dispatch } = useUser();
    const pageNameEditJson = getPageContent(language, PAGES.ProfileNameEdit);
    const navigateHelper = useNavigateHelper();
    const { cloneUserProfile, updateClonedProfile } = userProfileDispatch(dispatch);
    const confirmation = `/${language}${NAVIGATION_LINKS.profileUpdateNameConfirmUpdate}`;
    const backtoProfile = `/${language}${NAVIGATION_LINKS.profileHome}`;
    const [editProfile, setEditProfile] = useState({ ...state.editProfile });

    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setEditProfile(prev => ({
            ...prev,
            [name]: value,
        }));
    };

    const useSubmitHandler = (event) => {
        event.preventDefault()
        const updatedName = {
            givenName: editProfile.givenName,
            familyName: editProfile.familyName,
            formatted: `${editProfile.givenName} ${editProfile.familyName}`
        }
        updateClonedProfile({ name: updatedName });
        navigateHelper(confirmation);
    }

    useEffect(() => {
        cloneUserProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    console.log('State', state)

    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">
                {pageNameEditJson['5']}
            </GcdsHeading>

            <GcdsText>
                {pageNameEditJson['6']}<strong>
                    {pageNameEditJson['7']}</strong>
            </GcdsText>

            <GcdsDetails detailsTitle={pageNameEditJson['1']} >

                <GcdsText><span>{pageNameEditJson['8']}</span></GcdsText>
                <ul style={{ margin: 0 }}>
                    <li>{pageNameEditJson['9']}</li>
                </ul>
                <GcdsText>{pageNameEditJson['10']}</GcdsText>
                <GcdsText>
                    {pageNameEditJson['11']}&nbsp;
                    <GcdsLink href="https://accounts.gc.ca/directory">
                        {pageNameEditJson['12']}
                    </GcdsLink>.
                </GcdsText>
            </GcdsDetails>

            <form id="form" style={{ marginTop: '38px' }} onSubmit={useSubmitHandler}>
                <GcdsContainer marginTop="100" marginBottom="0">
                    <GcdsInput
                        inputId="givenName"
                        label={pageNameEditJson['2']}
                        name="givenName"
                        type="text"
                        validateOn="other"
                        data-testid="givenName"
                        lang={language}
                        onChange={handleProfileChange}
                    />
                    <GcdsInput
                        inputId="familyName"
                        label={pageNameEditJson['3']}
                        name="familyName"
                        type="text"
                        validateOn="other"
                        data-testid="familyName"
                        lang={language}
                        required
                        onChange={handleProfileChange}
                    />
                    <SubmitButton currentLang={language} disabled={false} onGcdsClick={useSubmitHandler} />{' '}
                    <GcdsButton buttonRole="secondary" onGcdsClick={(ev) => {
                        console.log(ev)
                        ev.preventDefault();
                        navigateHelper(backtoProfile)
                    }}>
                        {pageNameEditJson['4']}
                    </GcdsButton>
                </GcdsContainer>
            </form>
        </GcdsContainer>
    );
}
