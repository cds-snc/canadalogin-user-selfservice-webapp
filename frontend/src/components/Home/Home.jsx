import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsDetails,
    GcdsInput, GcdsErrorSummary
} from "@cdssnc/gcds-components-react";
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    SERVICES,
    PAGES,
} from "../../utils/constants";
import {getPageContent, isEmailValid} from '../../utils/functions';
import FirstTimeGc from "../Layout/FirstTimeGc";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useState} from "react";
import config from "../../config.jsx";
import {useUser} from "../Providers/useUser.tsx";
import {getLanguage} from "../../utils/functions";
import {useError} from "../../hooks/useError.js";
import {useSubmit} from "../../hooks/useSubmit.js";
import {useParams} from "react-router";

console.log("Config URL", config.apiUrl);

export default function Home() {
    const {language} = useParams();
    const {state} = useUser();
    const [email, setEmail] = useState(state.userData.email);
    const currentLang = getLanguage(language);
    const pageContentJson = getPageContent(currentLang, PAGES.home);
    const {setError, clearAllErrors, getError, hasErrors} = useError(currentLang);
    const error = getError('#email');

    function validateEmail(email) {
        setEmail(email);
        clearAllErrors();
        if(!isEmailValid(email)) {
            setError('#email', '2');
            return false;
        }
        return true;
    }

    const submitDataOptions = {
        endpoint: null,
        navigateTo: "/" + currentLang + "/" + FLOW_TYPES.signIn + NAVIGATION_LINKS.password,
        type:FLOW_TYPES.email,
        page: PAGES.home,
        flow: FLOW_TYPES.signIn,
        onError: (err)=> setError('#email',err)
    };
    const {handleSubmit, isPending} = useSubmit(submitDataOptions, validateEmail );

    console.log("Config URL", config.apiUrl);
    return (
        <GcdsContainer>
            <GcdsContainer>
                {
                    hasErrors()&&(<GcdsErrorSummary data-testid='errorSummary'
                                                    errorLinks={`{"#email": "${error.errorMsg}"}`}
                                                    heading={ error.heading}
                    />)
                }
                <GcdsHeading tag="h1">
                        {pageContentJson['1']}
                </GcdsHeading>
                <GcdsText>
                    <span>{pageContentJson['2']}</span> <strong>{pageContentJson['9']}</strong> {pageContentJson['10']}
                    <strong>
                        {currentLang===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':<br/>}
                        {` ${SERVICES[0].title}`}{currentLang!==AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']:''}
                    </strong>
                </GcdsText>
                <GcdsDetails detailsTitle={pageContentJson['4']}>
                    <GcdsText>
                        {pageContentJson['5']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['6']}
                    </GcdsText>
                    <GcdsText>
                            {pageContentJson['7']}
                    </GcdsText>
                </GcdsDetails>
            </GcdsContainer>
                <GcdsContainer>
                    <GcdsText marginTop="100" marginBottom="0">
                        <form id="form" onSubmit={handleSubmit} >
                            <GcdsInput
                                inputId="email"
                                label={pageContentJson['8']}
                                name="email"
                                type="email"
                                value={state.testData!=null?state.testData.email:email}
                                validateOn="other"
                                onGcdsChange={(e) => {validateEmail(e.target.value)}}
                                errorMessage={error.errorMsg}
                                data-testid="signin-email"
                                lang={currentLang}
                            ></GcdsInput>
                            <SubmitButton currentLang={currentLang} disabled={isPending} />
                        </form>
                    </GcdsText>
                </GcdsContainer>
            <FirstTimeGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

