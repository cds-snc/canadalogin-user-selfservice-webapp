import {
    GcdsContainer, GcdsFieldset,
    GcdsLink, GcdsRadioGroup,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";

export default function RegisterVerification({currentLang}) {
    const {state, dispatch} = useUser();
    const pageContentJson = getPageContent(currentLang, "RegisterVerification");

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="3" totalSteps="5"
                                 tag="h1"
                                 lang={currentLang}>
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        <strong>{pageContentJson['2']}</strong>
                    </GcdsText>
                    <GcdsText>
                        <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                            {pageContentJson['3']}
                        </GcdsLink>
                    </GcdsText>
                    <GcdsFieldset
                        fieldset-id="gcds-verification-fieldset"
                        legend={pageContentJson['4']}
                        hint={pageContentJson['5']}
                        required>
                        <br />
                        <GcdsRadioGroup
                            name="language"
                            options={'['+
                                `{"label": "${pageContentJson['6']}",`+
                                `"id": "english", "value": "eng","checked":"true",`+
                                `"hint": "${pageContentJson['7']}"},`+
                                `{"label": "${pageContentJson['8']}",`+
                                `"id": "french", "value": "fr",`+
                                `"hint": "${pageContentJson['9']}"}]`}
                        />
                    </GcdsFieldset>
                    <SubmitButton currentLang={currentLang}  />
                </GcdsContainer>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}