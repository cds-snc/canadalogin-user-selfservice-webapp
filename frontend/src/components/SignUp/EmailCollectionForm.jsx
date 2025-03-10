import {
    GcdsButton,
    GcdsContainer,
    GcdsFieldset,
    GcdsInput,
    GcdsRadioGroup
} from "@cdssnc/gcds-components-react";
import {getPageContent} from "../../utils/functions";


export default function EmailCollectionForm({currentLang}) {
    const pageContentJson = getPageContent(currentLang, "EmailCollectionForm");
    return (
        <form>
            <GcdsContainer marginTop="100" marginBottom="0">
                <GcdsInput
                    inputId="email"
                    label={pageContentJson['1']}
                    name="email"
                    required />
                <GcdsFieldset
                    fieldset-id="gcds-email-fieldset"
                    legend={pageContentJson['2']}
                    hint= {pageContentJson['4']}
                    required>
                    <br />
                    <GcdsRadioGroup
                        name="language"
                        options={`[
                                    {"label": "${pageContentJson['6']}",
                                     "id": "english", "value": "eng"${ currentLang!=='fr'?',"checked":"true"':'' }},
                                    {"label": "${pageContentJson['7']}",
                                     "id": "french", "value": "fr"${ currentLang==='fr'?',"checked":"true"':'' }}
                                ]`}
                    />
                </GcdsFieldset>
                <GcdsButton type="submit">
                    {pageContentJson['5']}
                </GcdsButton>
            </GcdsContainer>
        </form>
    )
}