import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput, GcdsLink, GcdsNotice, GcdsStepper, GcdsText,
} from "@cdssnc/gcds-components-react";
import {getPageContent, isNameValid} from "../../../utils/functions.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useUser} from "../../Providers/useUser.tsx";
import {useState, useTransition} from "react";
import {authService} from "../../../services/authService.jsx";
import {CONTEXT_ACTIONS, PAGES} from "../../../utils/constants.jsx";
import {useNavigate, useParams} from "react-router";

export default function CreateCoreProfile() {
    const {state, dispatch} = useUser();
    const {language} = useParams();
    const [errorJson, setError] = useState({heading: null, nameError:null});
    const navigate = useNavigate();
    const errorPageJson = getPageContent(language, "Error");
    const pageContentJson = getPageContent(language, PAGES.coreProfile);
    const [isPending, startTransition] = useTransition();

    function  handleSubmit (e){
        startTransition(async()=> {
            e.preventDefault();

            const formData = new FormData(e.target);
            const formFirstName = formData.get('firstName');
            const formLastName= formData.get('lastName');

            if (!isNameValid(formLastName) || (formFirstName!==null && !isNameValid(formFirstName) )) {
                console.log("name is not valid")
                setError({nameError: errorPageJson[11], heading: errorPageJson['1']});
                return;
            }
            setError({nameError:null, heading:null});

            try {
                let name = formLastName.trim();

                if(formFirstName!==null)
                    name = formFirstName.trim() + ' ' + name;

                const response = await authService.createCoreProfile({
                    name: name
                });
                if(response.success){
                    const userData = {...state.userData, coreProfileCreated: true};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success...",response)
                    navigate("/" + language + '/redirecttorp');
                }else {
                    console.log("Error....", response);
                    setError({nameError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({nameError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']} >
                &nbsp;
            </GcdsNotice>
            <br/>
            {
                errorJson.nameError!==null&&(<GcdsErrorSummary
                    errorLinks={`{"#lastName": "${errorJson.nameError}"}`}
                    heading={errorJson.heading}
                    data-testid="errorSummary"
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
                    <InputBox language={language} errorJson={errorJson} pageContentJson={pageContentJson} state={state} />
                    <SubmitButton currentLang={language} disabled={isPending}/>
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}

function InputBox({pageContentJson, language, errorJson, state}) {


    if(state.testData!==undefined)
        return (<>
                <GcdsInput
                    inputId="firstName"
                    label={pageContentJson['7']}
                    name="firstName"
                    value={state.testData.firstName}
                    type="text"
                    lang={language}
                    optional
                ></GcdsInput>
                <GcdsInput
                    inputId="lastName"
                    label={pageContentJson['8']}
                    name="lastName"
                    type="text"
                    value={state.testData.lastName}
                    validateOn="other"
                    errorMessage={errorJson.nameError}
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
                    lang={language}
                    optional
                ></GcdsInput>
                <GcdsInput
                    inputId="lastName"
                    label={pageContentJson['8']}
                    name="lastName"
                    type="text"
                    validateOn="other"
                    errorMessage={errorJson.nameError}
                    lang={language}
                    required
                ></GcdsInput></>
    )
}