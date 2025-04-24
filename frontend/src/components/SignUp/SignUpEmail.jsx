import {
    GcdsContainer,
    GcdsErrorSummary, GcdsFieldset,
    GcdsInput, GcdsRadioGroup, GcdsStepper
} from "@cdssnc/gcds-components-react";
import {useState, useTransition} from "react";
import {CONTEXT_ACTIONS, FLOW_TYPES, NAVIGATION_LINKS} from "../../utils/constants";
import {getPageContent, isEmailValid} from '../../utils/functions';
import AlreadyGc from "../Layout/AlreadyGc.jsx";
import {useUser} from "../Providers/useUser";
import {useNavigate, useParams} from "react-router";
import {authService} from "../../services/authService.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";

export default function SignUpEmail() {
    const {language} = useParams();
    const {state, dispatch} = useUser();
    const [email, setEmail] = useState(state.userData.email);
    const [errorJson, setError] = useState({heading: null, emailError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(language, "SignUpEmail");
    const errorPageJson = getPageContent(language, "Error");

    function validateEmail(email) {
        setEmail(email);

        if(isEmailValid(email)) {
            setError({emailError: null, heading: null});
            return true;
        }
        else {
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
                const response = await authService.sendTwoStepVerificationCode({
                    userName: formData.get('email'),
                    verificationType: FLOW_TYPES.email
                });
                console.log("response", response);
                if(response.success){
                    const userData = {
                        ...state.userData,
                        email: formEmail,
                        emailLanguage: formData.get('language'),
                        trxnId: response.data.trxnId
                    };
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success", "/" + language + NAVIGATION_LINKS.verifyEmail);
                    navigate("/" + language + NAVIGATION_LINKS.verifyEmail);
                }else {
                    console.log("Error....", response);
                    setError({emailError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
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
                             value={state.testData!=null?state.testData.email:email}
                             validateOn="other"
                             onGcdsChange={(e) => {validateEmail(e.target.value)}}
                             errorMessage={errorJson.emailError}
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
                                 options={'['+
                                     `{"label": "${pageContentJson['5']}",`+
                                     `"id": "english", "value": "eng"${ language!=='fr'?',"checked":"true"':'' }},`+
                                     `{"label": "${pageContentJson['6']}",`+
                                     `"id": "french", "value": "fr"${ language==='fr'?',"checked":"true"':'' }}`+
                                     `]`}
                             />
                         </GcdsFieldset>
                         <SubmitButton currentLang={language} disabled={isPending} />
                     </GcdsContainer>
                 </form>
            </GcdsContainer>
            <AlreadyGc currentLang={language}/>
        </GcdsContainer>
    )
}

