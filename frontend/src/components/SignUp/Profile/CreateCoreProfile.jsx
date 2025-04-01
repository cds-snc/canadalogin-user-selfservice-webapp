import {
    GcdsContainer, GcdsHeading, GcdsInput, GcdsLink, GcdsNotice, GcdsStepper, GcdsText,
} from "@cdssnc/gcds-components-react";
import {getPageContent} from "../../../utils/functions.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";


export default function CreateCoreProfile({currentLang}) {

    const pageContentJson = getPageContent(currentLang, "CreateCoreProfile");

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']} >
                &nbsp;
            </GcdsNotice>
            <br/>
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep="4" totalSteps="4"
                             tag="h1"
                             lang={currentLang}>
                    {pageContentJson['2']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsText>
                    {pageContentJson['3']}&nbsp;
                    <GcdsLink href="#">{pageContentJson['4']}</GcdsLink>
                    &nbsp;{pageContentJson['5']}
                </GcdsText>
                <GcdsHeading tag='h2'>
                    {pageContentJson['6']}
                </GcdsHeading>
                <form >
                    <GcdsInput
                        inputId="firstName"
                        label={pageContentJson['7']}
                        name="firstName"
                        type="text"
                        lang={currentLang}
                        optional
                    ></GcdsInput>
                    <GcdsInput
                        inputId="lastName"
                        label={pageContentJson['8']}
                        name="lastName"
                        type="text"
                        lang={currentLang}
                        required
                    ></GcdsInput>
                    <SubmitButton currentLang={currentLang} />
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}

