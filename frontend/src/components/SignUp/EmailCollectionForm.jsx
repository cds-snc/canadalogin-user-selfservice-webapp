import {
    GcdsContainer,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup
} from "@cdssnc/gcds-components-react";
import {useState, useTransition} from "react";
import {getPageContent, isEmailValid} from "../../utils/functions";
import {useNavigate} from "react-router";
import {CONTEXT_ACTIONS, NAVIGATION_LINKS} from "../../utils/constants.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useUser} from "../Providers/UserContext.jsx";
import {authService} from "../../services/authService.jsx";


export default function EmailCollectionForm({currentLang, errorJson, setError}) {
    const {state, dispatch} = useUser();
    const [email, setEmail] = useState(state.userData.email);
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const errorPageJson = getPageContent(currentLang, "Error");
    const pageFormJson = getPageContent(currentLang, "EmailCollectionForm");

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
                const response = await authService.sendOtpCode({
                    userName: formData.get('email')
                });
                console.log(response);
                if(response.success){
                    const userData = {
                        ...state.userData,
                        email: formEmail,
                        emailLanguage: formData.get('language'),
                        trxnId: response.data.trxnId
                    };
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    navigate("/" + currentLang + NAVIGATION_LINKS.verifyEmail);
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
        <form id="form" onSubmit={handleSubmit}>
            <GcdsContainer marginTop="100" marginBottom="0" >
                <GcdsInput
                    inputId="email"
                    label={pageFormJson['1']}
                    name="email"
                    type="email"
                    value={state.testData!=null?state.testData.email:email}
                    validateOn="other"
                    onGcdsChange={(e) => {validateEmail(e.target.value)}}
                    errorMessage={errorJson.emailError}
                    data-testid="email"
                    lang={currentLang}
                    required ></GcdsInput>
                <GcdsFieldset
                    fieldset-id="gcds-email-fieldset"
                    legend={pageFormJson['2']}
                    hint={pageFormJson['4']}
                    lang={currentLang}
                    required>
                    <br />
                    <GcdsRadioGroup
                        name="language"
                        options={'['+
                                    `{"label": "${pageFormJson['6']}",`+
                                    `"id": "english", "value": "eng"${ currentLang!=='fr'?',"checked":"true"':'' }},`+
                                   `{"label": "${pageFormJson['7']}",`+
                                    `"id": "french", "value": "fr"${ currentLang==='fr'?',"checked":"true"':'' }}`+
                               `]`}
                    />
                </GcdsFieldset>
                <SubmitButton currentLang={currentLang} disabled={isPending} />
            </GcdsContainer>
        </form>
    )
}