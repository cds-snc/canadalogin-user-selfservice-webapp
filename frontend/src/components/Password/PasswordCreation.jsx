import {GcdsContainer, GcdsHeading, GcdsLink, GcdsText, GcdsDetails, GcdsInput, GcdsNotice, GcdsStepper, GcdsCheckbox, GcdsErrorSummary} from "@cdssnc/gcds-components-react";
import {getPageContent, isPasswordValid} from '../../utils/functions';
import {useEffect, useState, useTransition} from 'react';
import {authService} from "../../services/authService.jsx";
import {CONTEXT_ACTIONS, NAVIGATION_LINKS} from "../../utils/constants.jsx";
import {useUser} from "../Providers/UserContext.jsx";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useNavigate} from "react-router";




export default function PasswordCreation({currentLang}) {
    const {state, dispatch} = useUser();
    const [checkedValue, setCheckedValue] = useState(true);
    const [passwordPolicy, setPasswordPolicy] = useState({min: 12, max:65})
    const [passwordStrength, setPasswordStrength] = useState(0);
    const [visibility, setVisibility] = useState(false);
    const [errorJson, setError] = useState({heading: null, passwordError:null});
    const [isPending, startTransition] = useTransition();
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "PasswordCreation");
    const errorPageJson = getPageContent(currentLang, "Error");

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
                setError({passwordError: errorPageJson[5], heading: errorPageJson['1']});
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
                    console.log("navigate ", "/" + currentLang + NAVIGATION_LINKS.twoStepVerification);
                    navigate("/" + currentLang + NAVIGATION_LINKS.twoStepVerification);
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
        console.log(checkedValue);
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
                />)
            }
            <GcdsContainer centered className="gcds-notice">
                <GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['1']}>
                    &nbsp;
                </GcdsNotice>
            </GcdsContainer>
                <GcdsText>
                    <GcdsStepper currentStep="2" totalSteps="5" tag="h1" lang={currentLang} marginTop="150" marginBottom="0">
                        {pageContentJson['3']}
                    </GcdsStepper>
                </GcdsText>
            <GcdsText testId="password-text">
                {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>{pageContentJson['6']}
            </GcdsText>
                    <GcdsDetails detailsTitle={pageContentJson['7']}>
                    <GcdsText>
                        {pageContentJson['8']}
                    </GcdsText>
                    </GcdsDetails>
            <GcdsContainer>
                <form onSubmit={handleSubmit} >
                    <GcdsInput
                        inputId="input-password"
                        label={pageContentJson['9']}
                        name="password"
                        hint={pageContentJson['10']}
                        type={checkedValue? "password" : "text"}
                        className="form-control"
                        onGcdsInput={handlePasswordChange}
                        errorMessage={errorJson.passwordError}
                        required
                    >
                    </GcdsInput>
                        <GcdsCheckbox
                            checkboxId="checkbox-default"
                            label={pageContentJson['11']}
                            name="checkbox"
                            onGcdsChange={validateCheckbox}>
                            <GcdsText>
                                {checkedValue? "false" : "true"}
                            </GcdsText>
                        </GcdsCheckbox>
                        <GcdsText>
                            {pageContentJson['12']} <strong>{passwordStrength}</strong>/{passwordPolicy.min} {pageContentJson['13']}
                        </GcdsText>
                    <SubmitButton currentLang={currentLang} disabled={isPending} />
                </form>
            </GcdsContainer>
            <GcdsHeading tag="h2">
                {pageContentJson['14']}
                <GcdsText marginTop="200" marginBottom="0">
                    <GcdsLink href={`/${currentLang}`}>
                        {pageContentJson['15']}
                    </GcdsLink>
                </GcdsText>
            </GcdsHeading>
        </GcdsContainer>
    )
}



