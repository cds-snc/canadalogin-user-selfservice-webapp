import {
    GcdsButton,
    GcdsContainer,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup
} from "@cdssnc/gcds-components-react";
import {useState} from "react";
import {getPageContent, isEmailValid} from "../../utils/functions";



export default function EmailCollectionForm({currentLang, submitForm, errorJson, setError}) {
    const [email, setEmail] = useState("");
    const errorPageJson = getPageContent(currentLang, "Error");
    const pageFormJson = getPageContent(currentLang, "EmailCollectionForm");

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
        setEmail(formData.get('email'));

        if(!isEmailValid(formData.get('email'))){
            setError({emailError: errorPageJson[2], heading: errorPageJson['1']});
            return;
        }
        setError({emailError:null, heading:null});

        await submitForm();

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
                        options={`[
                                    {"label": "${pageFormJson['6']}",
                                     "id": "english", "value": "eng"${ currentLang!=='fr'?',"checked":"true"':'' }},
                                    {"label": "${pageFormJson['7']}",
                                     "id": "french", "value": "fr"${ currentLang==='fr'?',"checked":"true"':'' }}
                                ]`}
                    />
                </GcdsFieldset>
                <GcdsButton type="submit" >
                    {pageFormJson['5']}
                </GcdsButton>
            </GcdsContainer>
        </form>
    )
}