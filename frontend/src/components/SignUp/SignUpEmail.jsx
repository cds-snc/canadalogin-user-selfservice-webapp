import {
    GcdsContainer,
    GcdsErrorSummary,
    GcdsHeading,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {useState} from "react";
import {AVAILABLE_LANGUAGES, SERVICES} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import EmailCollectionForm from "./EmailCollectionForm";
import AlreadyGc from "../Layout/AlreadyGc.jsx";
import {useUser} from "../Providers/UserContext.jsx";

export default function SignUpEmail({currentLang}) {
    const {state} = useUser();
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
                        <strong> {currentLang===AVAILABLE_LANGUAGES.fr&&(pageContentJson['3']+' ')}{` ${state.userData.service}`}{currentLang===AVAILABLE_LANGUAGES.en&&(' '+pageContentJson['3'])}</strong>
                    </GcdsText>
                </GcdsHeading>
                <GcdsHeading tag="h2">
                    {pageContentJson['4']}
                </GcdsHeading>
                <EmailCollectionForm currentLang={currentLang}  errorJson={errorJson} setError={setError}/>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

