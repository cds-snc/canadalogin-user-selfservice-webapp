import {
    GcdsContainer,
    GcdsText,
    GcdsDetails,
    GcdsInput,
    GcdsNotice,
    GcdsStepper,
    GcdsCheckbox,
    GcdsErrorSummary,
    GcdsHeading, GcdsLink
} from "@cdssnc/gcds-components-react";
import {getPageContent, isPasswordValid} from '../../utils/functions';
import {useEffect, useState, useTransition} from 'react';
import {authService} from "../../services/authService.jsx";
import {
    AVAILABLE_LANGUAGES,
    CONTEXT_ACTIONS,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SERVICES
} from "../../utils/constants.jsx";
import {useUser} from "../Providers/UserContext.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useNavigate, useParams} from "react-router";
import AlreadyGc from "../Layout/AlreadyGc.jsx";




export default function PasswordCreation() {
    const {state, dispatch} = useUser();
    const {language, flow} = useParams();
    const [checkedValue, setCheckedValue] = useState(true);
    const [passwordPolicy, setPasswordPolicy] = useState({min: 12, max:65})
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [visibility, setVisibility] = useState(false);
    const [errorJson, setError] = useState({heading: null, passwordError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(language, PAGES.password);
    const errorPageJson = getPageContent(language, "Error");

    useEffect( () => {
        loadMinMax();
    },[])

    async function loadMinMax(){

        let policy = {min:12, max:65};
        try {
            const response = await authService.requestPasswordPolicy();
            if(response.success)
                policy = {min: response.data.pwdMinLength, max: response.data.pwdMaxLength};
            else
                console.log(response.message);
        }catch(err){
            console.log(err);
        }
        setPasswordPolicy(policy);
    }
    async function handleSubmit (event) {
        startTransition(async()=> {
            event.preventDefault();

            const formData = new FormData(event.target);
            formData.get('password');
            setVisibility(!visibility);
            if (!isPasswordValid(formData.get('password'))) {
                const errorString = `${errorPageJson[5]} ${passwordPolicy.min} ${errorPageJson[12]} ${passwordPolicy.max} ${errorPageJson[13]}`
                setError({passwordError: errorString, heading: errorPageJson['1']});
                return;
            }

            setError({passwordError: null, heading: null});

            try {
                const response = await authService.create({
                    userName: state.userData.email,
                    password: formData.get('password'),
                });

                if (response.success) {
                    console.log("User created successfully ", response);
                    const userData = {...state.userData, passwordSubmitted: true};
                    console.log("userData ", userData);
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("navigate ", "/" + language + NAVIGATION_LINKS.twoStepVerification);
                    navigate("/" + language + NAVIGATION_LINKS.twoStepVerification);
                    console.log("navigating.....")
                } else {
                    console.log("Error....", response);
                    setError({passwordError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({passwordError: errorPageJson[7], heading: errorPageJson['1']});
            }
        });
    }

    function validateCheckbox ()  {
        setCheckedValue (!checkedValue);
    }

    function handlePasswordChange (event) {
        const password = event.target.value;
        setError({passwordError: null, heading: null});
        setPasswordStrength(password.length);
    }

    return (
        <GcdsContainer className="gcds-content" >
            {
                errorJson.passwordError!==null&&(<GcdsErrorSummary
                    errorLinks={`{"#password": "${errorJson.passwordError}"}`}
                    heading={errorJson.heading}
                    data-testid="errorSummary"
                />)
            }
            {
                flow===FLOW_TYPES.signUp&&(
                   <>
                       <GcdsContainer centered className="gcds-notice">
                           <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']}>
                               &nbsp;
                           </GcdsNotice>
                       </GcdsContainer>
                       <GcdsText>
                           <GcdsStepper currentStep="2" totalSteps="4" tag="h1" lang={language} marginTop="150" marginBottom="0">
                               {pageContentJson['3']}
                           </GcdsStepper>
                       </GcdsText>
                       <GcdsText>
                           <span>{pageContentJson['4']}</span> <strong><span>{pageContentJson['5']}</span> {passwordPolicy.min} </strong> <span>{pageContentJson['6']}</span>
                       </GcdsText>
                       <GcdsDetails detailsTitle={pageContentJson['7']}>
                           <GcdsText>
                               {pageContentJson['8']}
                           </GcdsText>
                       </GcdsDetails>
                   </>
                )
            }
            {
                flow===FLOW_TYPES.signIn&&(
                    <>
                        <GcdsHeading tag="h1">
                            {pageContentJson['14']}
                            <GcdsText marginTop="150" marginBottom="0">
                                {pageContentJson['15']}
                                <strong>
                                    {language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['16']+' ':''}
                                    {` ${SERVICES[0].title}`}{language===AVAILABLE_LANGUAGES.en?' '+pageContentJson['16']:''}
                                </strong>
                            </GcdsText>
                        </GcdsHeading>
                        <GcdsText>
                            <strong>{pageContentJson['17']}</strong>
                        </GcdsText>
                        <GcdsText>
                            <GcdsText>
                                <GcdsLink href={`/${language}${NAVIGATION_LINKS.home}`} >
                                    {pageContentJson['18']}
                                </GcdsLink>
                            </GcdsText>
                        </GcdsText>
                    </>
                )
            }
            <GcdsContainer>
                <form id="form" onSubmit={handleSubmit} >
                    { state.testData!==undefined&&(
                        <GcdsInput
                            inputId="input-password"
                            label={pageContentJson['9']}
                            name="password"
                            value={state.testData.password}
                            hint={flow===FLOW_TYPES.signUp?pageContentJson['10']:''}
                            type={checkedValue? "password" : "text"}
                            onGcdsInput={handlePasswordChange}
                            errorMessage={errorJson.passwordError}
                        ></GcdsInput>)
                    }
                    { state.testData===undefined&&(<GcdsInput
                        inputId="input-password"
                        label={pageContentJson['9']}
                        name="password"
                        hint={flow===FLOW_TYPES.signUp?pageContentJson['10']:''}
                        type={checkedValue? "password" : "text"}
                        onGcdsInput={handlePasswordChange}
                        errorMessage={errorJson.passwordError}
                    ></GcdsInput>)
                    }
                    <GcdsCheckbox
                        checkboxId="checkbox-default"
                        label={pageContentJson['11']}
                        name="checkbox"
                        onGcdsChange={validateCheckbox}>
                    </GcdsCheckbox>
                    {
                        flow===FLOW_TYPES.signUp&&(
                                <GcdsText>
                                    <span>{pageContentJson['12']}</span> <strong>{passwordStrength}</strong> / {passwordPolicy.min} <span>{pageContentJson['13']}</span>
                                </GcdsText>
                        )
                    }

                    <SubmitButton currentLang={language} disabled={isPending} />
                </form>
            </GcdsContainer>
            {
                flow===FLOW_TYPES.signUp&&(
                    <AlreadyGc currentLang={language}/>
                )
            }
            {
                flow===FLOW_TYPES.signIn&&(
                    <>
                        <br />
                        <GcdsText>
                            <GcdsLink href={`/${language}${NAVIGATION_LINKS.home}`} >
                                {pageContentJson['19']}
                            </GcdsLink>
                        </GcdsText>
                    </>
                )
            }
        </GcdsContainer>
    )
}




