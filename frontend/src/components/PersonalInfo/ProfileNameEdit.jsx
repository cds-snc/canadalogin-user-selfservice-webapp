import React from 'react';
import { GcdsButton, GcdsContainer, GcdsHeading, GcdsInput } from '@cdssnc/gcds-components-react';
import {
    GcdsGrid,
    GcdsText,
    GcdsDetails,
    GcdsLink
} from '@cdssnc/gcds-components-react';
import { getPageContent } from '../../utils/functions';
import { PAGES } from '../../utils/constants';
import { useParams } from 'react-router';
import SubmitButton from '../Layout/SubmitButton';

function ProfileNameEdit() {
    const { language } = useParams();
    const pageNameEditJson = getPageContent(language, PAGES.ProfileNameEdit);


    return (
        <GcdsContainer>
            <GcdsHeading tag="h1">Edit your name</GcdsHeading>
            <GcdsText>This will update your name with <strong>every service you have shared your name with through GC Sign in.</strong> </GcdsText>
            <GcdsDetails detailsTitle={pageNameEditJson['1']}>

            </GcdsDetails>


            <form id="form" style={{ marginTop: '38px' }}>
                <GcdsContainer marginTop="100" marginBottom="0" >
                    <GcdsInput
                        inputId="firstName"
                        label={pageNameEditJson['2']}
                        name="firstName"
                        type="text"
                        //value={state.testData!=null?state.testData.email:email}
                        validateOn="other"
                        // onGcdsChange={(e) => {validateEmail(e.target.value)}}
                        // errorMessage={error.errorMsg}
                        data-testid="firstNname"
                        lang={language}
                        required ></GcdsInput>
                    <GcdsInput
                        inputId="lastName"
                        label={pageNameEditJson['3']}
                        name="lastName"
                        type="text"
                        //value={state.testData!=null?state.testData.email:email}
                        validateOn="other"
                        // onGcdsChange={(e) => {validateEmail(e.target.value)}}
                        // errorMessage={error.errorMsg}
                        data-testid="lastName"
                        lang={language}
                         ></GcdsInput>
                         <SubmitButton currentLang={language} disabled={false}/>
                         <GcdsButton style={{marginLeft: "10px"}} >{pageNameEditJson['4']}</GcdsButton>
                </GcdsContainer>
            </form>
        </GcdsContainer>
    );
}

export default ProfileNameEdit;