import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsText,
} from "@cdssnc/gcds-components-react";
import {
    AVAILABLE_LANGUAGES,
    PAGES,
    SERVICES,
    FLOW_TYPES,
    SUBMIT_END_POINTS,
    NAVIGATION_LINKS
} from "../../utils/constants";
import {getPageContent} from '../../utils/functions';
import {useUser} from "../Providers/useUser";
import {useParams} from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useSubmit} from "../../hooks/useSubmit.js";
import {useError} from "../../hooks/useError.js";



export default function VerificationSelection() {
    const {language, flow} = useParams();
    const {state} = useUser();
    const {setError, hasErrors, getError} = useError(language);
    const pageContentJson = getPageContent(language, PAGES.verificationSelection);
    const error = getError('#number');

    const submitDataOptions = {
        language,
        endpoint: SUBMIT_END_POINTS.otpSend,
        navigateTo:  "/" + language + "/" + FLOW_TYPES.signIn + NAVIGATION_LINKS.verification+'/'+state.userData.otpType,
        page: PAGES.verificationSelection,
        flow: flow,
        policy: null,
        onError: (err)=> setError('#number',err)
    };

    const {handleSubmit, isPending} = useSubmit(submitDataOptions, null );

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {
                    hasErrors()&&(<GcdsErrorSummary data-testid='errorSummary'
                                                    errorLinks={`{"#number": "${error.errorMsg}"}`}
                                                    heading={ error.heading}
                    />)
                }
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
                <form id="form" onSubmit={handleSubmit} >
                    <SubmitButton currentLang={language} disabled={isPending} />
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}