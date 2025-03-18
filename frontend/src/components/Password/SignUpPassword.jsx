import {GcdsContainer, GcdsHeading, GcdsButton, GcdsLink, GcdsText, GcdsDetails, GcdsInput, GcdsNotice, GcdsStepper, GcdsCheckbox, GcdsErrorSummary} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES, NAVIGATION_LINKS} from "../../utils/constants";
// import {useNavigate} from "react-router";
import {getPageContent} from '../../utils/functions';
import { useState, useActionState } from 'react';
import AlreadyGc from "../Layout/AlreadyGc.jsx";

const submitForm = async () => {
    //update logic for sending to server API mockup
}

export default function SignUpPassword({currentLang}){
    const [state, isPending] = useActionState(submitForm, {sucess: false, message:null, error:null});
    const [errorJson, setError] = useState({heading:null, passwordError:null});
    const pageContentJson = getPageContent(currentLang, "SignUpPassword");

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {errorJson.passwordError!==null&&(
                    <GcdsErrorSummary
                        errorLinks={`{"#password": "${errorJson.passwordError}"}`}
                        heading={errorJson.heading}
                    />
                )}
                <GcdsHeading tag="h1">
                    {pageContentJson['1']}
                    <GcdsText marginTop="200" marginBottom="0">
                        {pageContentJson['2']}
                        <strong> {currentLang===AVAILABLE_LANGUAGES.fr&&(pageContentJson['4']+' ')}{` ${SERVICES[0].title}`}{currentLang===AVAILABLE_LANGUAGES.en&&(' '+pageContentJson['3'])}</strong>
                    </GcdsText>
                </GcdsHeading>
                <GcdsHeading tag="h2">
                    {pageContentJson['5']}
                </GcdsHeading>
            
            <PasswordCollectionForm currentLang={currentLang} submitForm={submitForm} errorJson={errorJson} setError={setError}/>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>

    )
} 