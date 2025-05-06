import {
    GcdsContainer, GcdsFieldset, GcdsHeading, GcdsRadioGroup, GcdsText,
} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, PAGES, SERVICES, FLOW_TYPES} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import {useUser} from "../Providers/useUser";
import {useParams} from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function VerificationSelection() {
    const {language, type} = useParams();
    const {state} = useUser();
    const pageContentJson = getPageContent(language, PAGES.verificationSelection);

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsHeading tag="h1">
                    {pageContentJson['1']}
                    <GcdsText marginTop="150" marginBottom="0">
                        {pageContentJson['2']}
                        <strong>
                            {language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':''}
                            {` ${SERVICES[0].title}`}{language===AVAILABLE_LANGUAGES.en?' '+pageContentJson['3']:''}
                        </strong>
                    </GcdsText>
                </GcdsHeading>
                <form id="form" >
                    <GcdsFieldset
                        fieldset-id="gcds-email-fieldset"
                        legend={pageContentJson['4']}
                        lang={language}
                        required>
                        <br />
                        <GcdsRadioGroup
                            name="language"
                            options={'['+
                                `{"label": "${state.userData.phone}",`+
                                 `"hint": "${state.userData.otpType===FLOW_TYPES.sms?pageContentJson['5']:pageContentJson['6']} (default)",`+
                                `"id": "english", "value": "eng"${ language!=='fr'?',"checked":"true"':'' }}`+
                                `]`}
                        />
                    </GcdsFieldset>
                    <SubmitButton currentLang={language} />
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}