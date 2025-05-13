import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput, GcdsLink, GcdsNotice, GcdsStepper, GcdsText,
} from "@cdssnc/gcds-components-react";
import {getPageContent, isNameValid} from "../../../utils/functions.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useUser} from "../../Providers/useUser.tsx";
import {PAGES, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {useParams} from "react-router";
import {useSubmit} from "../../../hooks/useSubmit.js";
import {useError} from "../../../hooks/useError.js";

export default function CreateCoreProfile() {
    const {state} = useUser();
    const {language, flow} = useParams();
    const pageContentJson = getPageContent(language, PAGES.coreProfile);
    const {setError, getError, hasErrors, clearAllErrors} = useError(language);
    const error = getError('#profile');

    function validateNames(firstName, lastName){
        clearAllErrors();
        if(!isNameValid(lastName) || (firstName!==null && !isNameValid(firstName) )) {
            setError('#profile','11')
            return false;
        }
        return true;
    }

    const submitDataOptions = {
        language,
        endpoint: SUBMIT_END_POINTS.createCoreProfile,
        navigateTo: "/" + language + '/redirecttorp',
        page: PAGES.coreProfile,
        flow: flow,
        policy: null,
        onError: (err)=> setError('#profile',err)
    };

    const {handleSubmit, isPending} = useSubmit(submitDataOptions, validateNames);

    return (
        <GcdsContainer>
            <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']} >
                &nbsp;
            </GcdsNotice>
            <br/>
            {
                hasErrors()&&(<GcdsErrorSummary data-testid='errorSummary'
                                                errorLinks={`{"#profile": "${error.errorMsg}"}`}
                                                heading={error.heading}
                />)
            }
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep="4" totalSteps="4"
                             tag="h1"
                             lang={language}>
                    {pageContentJson['2']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsText>
                    <span>{pageContentJson['3']} </span>
                    <GcdsLink href="#">{pageContentJson['4']}</GcdsLink>
                    &nbsp;{pageContentJson['5']}
                </GcdsText>
                <GcdsHeading tag='h2'>
                    {pageContentJson['6']}
                </GcdsHeading>
                <form id="form" onSubmit={handleSubmit}>
                    <InputBox language={language} errorJson={error.errorMsg} pageContentJson={pageContentJson} state={state} />
                    <SubmitButton currentLang={language} disabled={isPending}/>
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}

function InputBox({pageContentJson, language, error, state}) {


    if(state.testData!==undefined)
        return (<>
                <GcdsInput
                    inputId="firstName"
                    label={pageContentJson['7']}
                    name="firstName"
                    size="10"
                    value={state.testData.firstName}
                    type="text"
                    lang={language}
                    optional
                ></GcdsInput>
                <GcdsInput
                    inputId="lastName"
                    label={pageContentJson['8']}
                    name="lastName"
                    size="10"
                    type="text"
                    value={state.testData.lastName}
                    validateOn="other"
                    errorMessage={error}
                    lang={language}
                    required
                ></GcdsInput></>
        )

    return (<>
                <GcdsInput
                    inputId="firstName"
                    label={pageContentJson['7']}
                    name="firstName"
                    type="text"
                    size="10"
                    lang={language}
                    optional
                ></GcdsInput>
                <GcdsInput
                    inputId="lastName"
                    label={pageContentJson['8']}
                    name="lastName"
                    type="text"
                    size="10"
                    validateOn="other"
                    errorMessage={error}
                    lang={language}
                    required
                ></GcdsInput></>
    )
}