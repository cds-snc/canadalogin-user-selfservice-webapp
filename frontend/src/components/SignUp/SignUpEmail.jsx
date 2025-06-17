import {
    GcdsContainer,
    GcdsErrorSummary,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup,
    GcdsStepper
} from "@cdssnc/gcds-components-react";
import { useState } from "react";
import { FLOW_TYPES, NAVIGATION_LINKS, PAGES, SUBMIT_END_POINTS } from "../../utils/constants";
import { getPageContent, isEmailValid } from '../../utils/functions';
import AlreadyGc from "../Layout/AlreadyGc.jsx";
import { useUser } from "../Providers/useUser";
import { useParams } from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";
import { useSubmit } from "../../hooks/useSubmit";
import { useError } from "../../hooks/useError";


export default function SignUpEmail() {
    const { language, flow } = useParams();
    const { state } = useUser();
    const [email, setEmail] = useState(state.userData.email);
    const pageContentJson = getPageContent(language, PAGES.signup);
    const { setError, clearAllErrors, getError, hasErrors } = useError(language);
    const error = getError('#email');

    function validateEmail(email) {
        setEmail(email);
        clearAllErrors();
        if (!isEmailValid(email)) {
            setError('#email', '2');
            return false;
        }
        return true;
    }
    const submitDataOptions = {
        language,
        endpoint: SUBMIT_END_POINTS.transientOtpSend,
        navigateTo: "/" + language + NAVIGATION_LINKS.verifyEmail, type: FLOW_TYPES.email,
        page: PAGES.signup,
        flow: flow,
        onError: (err) => setError('#email', err)
    };
    const { handleSubmit, isPending } = useSubmit(submitDataOptions, validateEmail);
    console.log("state.userData", state);
    return (
        <GcdsContainer>
            <GcdsContainer>
                {
                    hasErrors() && (<GcdsErrorSummary data-testid='errorSummary'
                        errorLinks={`{"#email": "${error.errorMsg}"}`}
                        heading={error.heading}
                    />)
                }
                <GcdsStepper currentStep="1" totalSteps="4"
                    tag="h1"
                    lang={language}>
                    {pageContentJson['1']}
                </GcdsStepper>
                <form id="form" onSubmit={handleSubmit}>
                    <GcdsContainer marginTop="100" marginBottom="0" >
                        <GcdsInput
                            inputId="email"
                            label={pageContentJson['2']}
                            name="email"
                            type="email"
                            value={state.testData != null ? state.testData.email : email}
                            validateOn="other"
                            onGcdsChange={(e) => { validateEmail(e.target.value) }}
                            errorMessage={error.errorMsg}
                            data-testid="email"
                            lang={language}
                            required ></GcdsInput>
                        <GcdsFieldset
                            fieldset-id="gcds-email-fieldset"
                            legend={pageContentJson['3']}
                            hint={pageContentJson['4']}
                            lang={language}
                            required>
                            <br />
                            <GcdsRadioGroup
                                name="language"
                                options={'[' +
                                    `{"label": "${pageContentJson['5']}",` +
                                    `"id": "english", "value": "eng"${language !== 'fr' ? ',"checked":"true"' : ''}},` +
                                    `{"label": "${pageContentJson['6']}",` +
                                    `"id": "french", "value": "fr"${language === 'fr' ? ',"checked":"true"' : ''}}` +
                                    `]`}
                            />
                        </GcdsFieldset>
                        <SubmitButton currentLang={language} disabled={isPending} />
                    </GcdsContainer>
                </form>
            </GcdsContainer>
            <AlreadyGc currentLang={language} />
        </GcdsContainer>
    )
}