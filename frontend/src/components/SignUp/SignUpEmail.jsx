import {
    GcdsContainer,
    GcdsHeading,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, SERVICES} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import FirstTimeGc from "../Layout/FirstTimeGc";
import EmailCollectionForm from "./EmailCollectionForm";


export default function SignUpEmail({currentLang}) {
    const pageContentJson = getPageContent(currentLang, "SignUpEmail");

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsHeading tag="h1">
                        {pageContentJson['1']}
                        <GcdsText marginTop="200" marginBottom="0">
                            {pageContentJson['2']}
                            <strong> {currentLang===AVAILABLE_LANGUAGES.fr?pageContentJson['3']+' ':''}{` ${SERVICES[0].title}`}{currentLang===AVAILABLE_LANGUAGES.en?' '+pageContentJson['3']:''}</strong>
                        </GcdsText>
                </GcdsHeading>
                <GcdsHeading tag="h2">
                    {pageContentJson['4']}
                </GcdsHeading>
                <EmailCollectionForm currentLang={currentLang}/>
            </GcdsContainer>
            <FirstTimeGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

