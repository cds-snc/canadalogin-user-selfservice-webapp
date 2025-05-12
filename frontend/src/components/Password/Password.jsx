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
import {useEffect, useState} from 'react';
import {authService} from "../../services/authService.jsx";
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SERVICES, SUBMIT_END_POINTS
} from "../../utils/constants.jsx";
import {useUser} from "../Providers/useUser.tsx";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useParams} from "react-router";
import {useSubmit} from "../../hooks/useSubmit.js";
import {useError} from "../../hooks/useError.js";

export default function Password() {
    const {state} = useUser();
    const {language, flow} = useParams();
    const {setError, clearAllErrors, getError, hasErrors} = useError(language);
    const [checkedValue, setCheckedValue] = useState(true);
    const [passwordPolicy, setPasswordPolicy] = useState({min: 12, max:65})
    const [passwordStrength, setPasswordStrength] = useState(0);
    const pageContentJson = getPageContent(language, PAGES.password);
    const errorPageJson = getPageContent(language, PAGES.error);
    const error = getError('#password');

    useEffect( () => {
        loadMinMax();
    },[])

    function handlePasswordChange (event) {
        clearAllErrors();
        setPasswordStrength(event.target.value.length);
    }
    function validatePassword(pass) {
        clearAllErrors();
        if(!isPasswordValid(pass)) {
            const errMessage = `${errorPageJson[5]} ${passwordPolicy.min} ${errorPageJson[12]} ${passwordPolicy.max} ${errorPageJson[13]}`;
            setError('#password', errMessage);
            return false;
        }
        return true;
    }

    async function loadMinMax(){

        let policy = {min:12, max:65};
        try {
            const response = await authService.requestPasswordPolicy();
            if(response.success)
                policy = {min: response.data.pwdMinLength, max: response.data.pwdMaxLength};
            else {
                console.log(response.message);
            }
        }catch(err){
            console.log(err);
        }
        setPasswordPolicy(policy);
    }

    const submitDataOptions = {
        language,
        endpoint: flow===FLOW_TYPES.signUp?SUBMIT_END_POINTS.create:SUBMIT_END_POINTS.login,
        navigateTo: flow===FLOW_TYPES.signUp?'/'+language+NAVIGATION_LINKS.twoStepVerification:'/'+language+'/'+FLOW_TYPES.signIn+NAVIGATION_LINKS.verification,
        page: PAGES.password,
        flow: flow,
        policy: passwordPolicy,
        onError: (err)=> setError('#password',err)
    };

    const {handleSubmit, isPending} = useSubmit(submitDataOptions, validatePassword );

    return (
        <GcdsContainer>
            {
                hasErrors()&&(<GcdsErrorSummary data-testid='errorSummary'
                                                errorLinks={`{"#password": "${error.errorMsg}"}`}
                                                heading={ error.heading}
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
                    <GcdsContainer className="max480">
                        { state.testData!==undefined&&(
                            <GcdsInput
                                inputId="input-password"
                                label={pageContentJson['9']}
                                name="password"
                                value={state.testData.password}
                                hint={flow===FLOW_TYPES.signUp?pageContentJson['10']:''}
                                type={checkedValue? "password" : "text"}
                                onGcdsInput={handlePasswordChange}
                                errorMessage={error.errorMsg}
                            ></GcdsInput>)
                        }
                        { state.testData===undefined&&(<GcdsInput
                            inputId="input-password"
                            label={pageContentJson['9']}
                            name="password"
                            hint={flow===FLOW_TYPES.signUp?pageContentJson['10']:''}
                            type={checkedValue? "password" : "text"}
                            onGcdsInput={handlePasswordChange}
                            errorMessage={error.errorMsg}
                        ></GcdsInput>)
                        }
                    </GcdsContainer>
                    <GcdsCheckbox
                        checkboxId="checkbox-default"
                        label={pageContentJson['11']}
                        name="checkbox"
                        onGcdsChange={()=> setCheckedValue (!checkedValue)}>
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
                flow===FLOW_TYPES.signUp
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