import {
    GcdsContainer,
    GcdsErrorSummary,
    GcdsHeading,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {useActionState, useState} from "react";
import {AVAILABLE_LANGUAGES, SERVICES} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import EmailCollectionForm from "./EmailCollectionForm";
import AlreadyGc from "../Layout/AlreadyGc.jsx";


const submitForm = async () =>{

    //update logic for sending to server once we have the back end
}

export default function SignUpEmail({currentLang}) {
    const [state, isPending] =
        useActionState(submitForm,{success:false, message:null, error:null});
    const [errorJson, setError] = useState({heading: null, emailError:null});

    const pageContentJson = getPageContent(currentLang, "SignUpEmail");


    return (
        <GcdsContainer className="gcds-content" >
             <GcdsContainer>
                {
                    errorJson.emailError!==null&&(<GcdsErrorSummary
                                errorLinks={`{"#email": "${errorJson.emailError}"}`}
                                heading={errorJson.heading}
                       />)
                }
                <GcdsHeading tag="h1">
                    {pageContentJson['1']}
                    <GcdsText marginTop="200" marginBottom="0">
                        {pageContentJson['2']}
                        <strong> {currentLang===AVAILABLE_LANGUAGES.fr&&(pageContentJson['3']+' ')}{` ${SERVICES[0].title}`}{currentLang===AVAILABLE_LANGUAGES.en&&(' '+pageContentJson['3'])}</strong>
                    </GcdsText>
                </GcdsHeading>
                <GcdsHeading tag="h2">
                    {pageContentJson['4']}
                </GcdsHeading>
                <EmailCollectionForm currentLang={currentLang} submitForm={submitForm} errorJson={errorJson} setError={setError}/>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

