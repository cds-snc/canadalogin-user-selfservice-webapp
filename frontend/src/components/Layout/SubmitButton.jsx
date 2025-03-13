import {GcdsButton} from "@cdssnc/gcds-components-react";
import {getPageContent} from "../../utils/functions.jsx";



export default function SubmitButton({currentLang}){
    const {submit} = getPageContent(currentLang, "Button");
    return  (
        <GcdsButton type="submit" >
            {submit}
        </GcdsButton>
    );
}


