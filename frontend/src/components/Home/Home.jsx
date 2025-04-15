import {
    GcdsContainer,
    GcdsHeading,
    GcdsText,
    GcdsDetails,
    GcdsInput, GcdsErrorSummary
} from "@cdssnc/gcds-components-react";
import {AVAILABLE_LANGUAGES, CONTEXT_ACTIONS, NAVIGATION_LINKS, SERVICES} from "../../utils/constants";
import {getPageContent, isEmailValid} from '../../utils/functions';
import FirstTimeGc from "../Layout/FirstTimeGc";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useState, useTransition} from "react";
import config from "../../config.jsx";
import {useUser} from "../Providers/UserContext.jsx";
import {useNavigate, useParams} from "react-router";

console.log("Config URL", config.apiUrl);

export default function Home({currentLang}) {
    // const {language} = useParams();
    const {state, dispatch} = useUser();
    const [email, setEmail] = useState("");
    const [errorJson, setError] = useState({heading: null, emailError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "Home");
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
                    console.log("success", "/" + currentLang + NAVIGATION_LINKS.verifyEmail);
                    // navigate("/" + language + NAVIGATION_LINKS.verifyEmail);
            } catch (error) {
                console.error('Signin error:', error);
                setError({emailError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

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
                                {` ${SERVICES[0].title}`}{currentLang===AVAILABLE_LANGUAGES.en?' '+pageContentJson['3']:''}
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
                            <SubmitButton currentLang={currentLang} disabled={isPending} />
                        </form>
                    </GcdsText>
                </GcdsContainer>
            <FirstTimeGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}

