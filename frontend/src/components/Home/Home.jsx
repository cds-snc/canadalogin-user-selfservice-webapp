import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsDetails,
    GcdsInput, GcdsErrorSummary
} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, CONTEXT_ACTIONS, FLOW_TYPES, NAVIGATION_LINKS, SERVICES, PAGES} from "../../utils/constants";
import {getPageContent, isEmailValid} from '../../utils/functions';
import FirstTimeGc from "../Layout/FirstTimeGc";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useState, useTransition} from "react";
import config from "../../config.jsx";
import {useUser} from "../Providers/useUser.tsx";
import {useNavigate} from "react-router";
import {useParams} from "react-router";
import {getLanguage} from "../../utils/functions";

console.log("Config URL", config.apiUrl);

export default function Home() {
    const {language} = useParams();
    const {state, dispatch} = useUser();
    const [email, setEmail] = useState("");
    const [errorJson, setError] = useState({heading: null, emailError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const currentLang = getLanguage(language);
    console.log("language: ", language);
    const pageContentJson = getPageContent(currentLang, PAGES.home);
    const errorPageJson = getPageContent(currentLang, "Error");


    function validateEmail(email) {
        setEmail(email);

        if (isEmailValid(email)) {
            setError({emailError: null, heading: null});
            return true;
        } else {
            setError({emailError: errorPageJson[2], heading: errorPageJson['1']});
            return false;
        }
    }

    function handleSubmit(e) {
        startTransition(async()=> {
            e.preventDefault();
            const formData = new FormData(e.target);
            const formEmail = formData.get('email');

            if(!validateEmail(formEmail))
                return;

            try {
                // await {userEmail: formData.get('email')}
                console.log("formEmail: ", formEmail);
                const userData = {
                    ...state.userData,
                    email: formEmail,
                };
                await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                console.log("userData: ", userData);
                console.log("success", "/" + currentLang + "/" + FLOW_TYPES.signIn + NAVIGATION_LINKS.password);
                navigate("/" + currentLang + "/" + FLOW_TYPES.signIn + NAVIGATION_LINKS.password);
            } catch (error) {
                console.error('Signin error:', error);
                setError({emailError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

    console.log("Config URL", config.apiUrl);
    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {
                    errorJson.emailError!==null&&(<GcdsErrorSummary data-testid='errorSummary'
                                                                    errorLinks={`{"#email": "${errorJson.emailError}"}`}
                                                                    heading={errorJson.heading}
                    />)
                }
                <GcdsHeading tag="h1">
                        {pageContentJson['1']}
                        <GcdsText marginTop="150" marginBottom="0">
                            {pageContentJson['2']}
                            <strong>
                                {currentLang===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']+' ':''}
                                {` ${SERVICES[0].title}`}{currentLang!==AVAILABLE_LANGUAGES.fr?' '+pageContentJson['3']:''}
                            </strong>
                        </GcdsText>
                </GcdsHeading>
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
                        <form id="form" onSubmit={handleSubmit}>
                            <GcdsInput
                                inputId="email"
                                label={pageContentJson['8']}
                                name="email"
                                type="email"
                                value={state.testData!=null?state.testData.email:email}
                                validateOn="other"
                                onGcdsChange={(e) => {validateEmail(e.target.value)}}
                                errorMessage={errorJson.emailError}
                                data-testid="signin-email"
                                lang={currentLang}
                            ></GcdsInput>
                            <SubmitButton currentLang={currentLang} />
                        </form>
                    </GcdsText>
                </GcdsContainer>
            <FirstTimeGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

