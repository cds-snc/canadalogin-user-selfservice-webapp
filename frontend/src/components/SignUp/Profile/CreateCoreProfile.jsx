import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput, GcdsLink, GcdsNotice, GcdsStepper, GcdsText,
} from "@cdssnc/gcds-components-react";
import {getPageContent, isNameValid} from "../../../utils/functions.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {startTransition, useState} from "react";
import {authService} from "../../../services/authService.jsx";
import {CONTEXT_ACTIONS} from "../../../utils/constants.jsx";
import {useNavigate} from "react-router";

export default function CreateCoreProfile({currentLang}) {
    const {state, dispatch} = useUser();
    const [errorJson, setError] = useState({heading: null, nameError:null});
    const navigate = useNavigate();
    const errorPageJson = getPageContent(currentLang, "Error");
    const pageContentJson = getPageContent(currentLang, "CreateCoreProfile");

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
                const response = await authService.createCoreProfile({

                });
                if(response.success){
                    const userData = {...state.userData, coreProfileCreated: true};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success...",response)
                    navigate("/" + currentLang );
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
                <form id="form" onSubmit={handleSubmit}>
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
                        validateOn="other"
                        errorMessage={errorJson.nameError}
                        lang={currentLang}
                        required
                    ></GcdsInput>
                    <SubmitButton currentLang={currentLang} />
                </form>
            </GcdsContainer>
        </GcdsContainer>
    )
}

