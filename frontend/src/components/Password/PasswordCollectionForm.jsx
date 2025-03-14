import {
    GcdsButton,
    GcdsContainer,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup
} from "@cdssnc/gcds-components-react";
import {useState} from "react";
import {getPageContent, isPasswordValid} from "../../utils/functions";

export default function PasswordCollectionForm({currentLang, submitForm, errorJson, setError}) {
    const [password, setPassword] = useState("");
    const errorPageJson = getPageContent(currentLang, "PasswordError");
    const pageFormJson = getPageContent(currentLang, "PasswordCollectionForm");

    const validatePassword = (e) => {

        setPassword(e.target.value);

        if(e.target?.value && isPasswordValid(e.target.value))
            setError({passwordError:null, heading:null});
        else
            setError({passwordError:errorPageJson[2], heading:errorPageJson['1']});
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(e.target);
        setPassword(formData.get('password'));

        if(!isPasswordValid(formData.get('password'))){
            setError({passwordError: errorPageJson[2], heading: errorPageJson['1']});
            return;
        }
        setError({passwordError:null, heading:null});

        await submitForm();

    }
    return (
        <form onSubmit={handleSubmit}>
            <GcdsContainer marginTop="100" marginBottom="0" >
                <GcdsInput
                    inputId="password"
                    label={pageFormJson['1']}
                    name="password"
                    type="password"
                    value={password}
                    validateOn="other"
                    onGcdsChange={validatePassword}
                    errorMessage={errorJson.passwordError}
                    required ></GcdsInput>
                    <GcdsFieldset
                    fieldset-id="gcds-password-fieldset"
                    legend={pageFormJson['3']}
                    hint= {pageFormJson['2']}
                    required>
                        <br />
                    </GcdsFieldset>
                    <GcdsButton type="submit" >
                    {pageFormJson['4']}
                </GcdsButton>
            </GcdsContainer>
        </form>
    )
}