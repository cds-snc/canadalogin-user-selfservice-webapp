import {
    GcdsContainer,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup
} from "@cdssnc/gcds-components-react";
import {useState} from "react";
import {getPageContent, isEmailValid} from "../../utils/functions";
import {useNavigate} from "react-router";
import {CONTEXT_ACTIONS, NAVIGATION_LINKS} from "../../utils/constants.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useUser} from "../Providers/UserContext.jsx";

export default function EmailCollectionForm({currentLang, errorJson, setError}) {
    const {state, dispatch} = useUser();
    const [email, setEmail] = useState('');
    const navigate = useNavigate();
    const errorPageJson = getPageContent(currentLang, "Error");
    const pageFormJson = getPageContent(currentLang, "EmailCollectionForm");

    const submitForm = async () =>{
        //update logic for sending to server once we have the back end
        const response = {success:true, message:"Successfully submitted", error:null}
        return response;
    }

    const validateEmail = (e) => {

        setEmail(e.target.value);

        if(e.target?.value && isEmailValid(e.target.value))
            setError({emailError:null, heading:null});
        else
            setError({emailError:errorPageJson[2], heading:errorPageJson['1']});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const formEmail = formData.get('email')
        setEmail(formEmail);

        if(!isEmailValid(formEmail)){
            setError({emailError: errorPageJson[2], heading: errorPageJson['1']});
            return;
        }

        setError({emailError:null, heading:null});

        const response = await submitForm(formData, currentLang);

        if (response.error)
            alert(response.error);
        else {
            const userData = {...state.userData, email: formEmail, emailLanguage: formData.get('language')};
            dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
            navigate("/" + currentLang + NAVIGATION_LINKS.verifyEmail);
        }

    }
    return (
        <form onSubmit={handleSubmit}>
            <GcdsContainer marginTop="100" marginBottom="0" >
                <GcdsInput
                    inputId="email"
                    label={pageFormJson['1']}
                    name="email"
                    type="email"
                    value={email}
                    validateOn="other"
                    onGcdsChange={validateEmail}
                    errorMessage={errorJson.emailError}
                    required ></GcdsInput>
                <GcdsFieldset
                    fieldset-id="gcds-email-fieldset"
                    legend={pageFormJson['2']}
                    hint= {pageFormJson['4']}
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
                <SubmitButton currentLang={currentLang} />
            </GcdsContainer>
        </form>
    )
}