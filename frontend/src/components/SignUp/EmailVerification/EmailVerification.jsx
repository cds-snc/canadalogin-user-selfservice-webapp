import {
    GcdsContainer, GcdsErrorSummary,
    GcdsHeading,
    GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import { useEffect, useState, useTransition} from "react";
import {useNavigate} from "react-router";
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {CONTEXT_ACTIONS, NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {getPageContent, isCodeValid} from "../../../utils/functions.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {authService} from "../../../services/authService.jsx";

const initialTime=10;

export default function EmailVerification({currentLang}) {
    const {state, dispatch} = useUser();
    const [time, setTime] = useState(initialTime);
    const [codeRequested, setCodeRequested] = useState(false);
    const [timesRequested, setTimesRequested] = useState(2);
    const [isPending, startTransition] = useTransition();
    const [errorJson, setError] = useState({heading: null, codeError:null});
    const navigate = useNavigate();
    const pageContentJson = getPageContent(currentLang, "EmailVerification");
    const errorPageJson = getPageContent(currentLang, "Error");

    useEffect(()=>{
        if(time<=0)
            return;

        const timer = setTimeout(()=>{
            setTime((prevTime) => prevTime-1);
            },1000);

        return () => clearTimeout(timer);

    },[time]);

    async function requestNewCode (e){
        setError({codeError:null, heading:null});
        sessionStorage.setItem('verificationCode', "");
        startTransition(async()=> {
            e.preventDefault();
            try {
                const response = await authService.signup({
                    emailAddress: state.userData.email
                });
                console.log(response);
                if(response.transactionID){
                    const userData = {
                        ...state.userData,
                        email: state.userData.email,
                        trxnId: response.transactionID
                    };
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    setCodeRequested(true);
                }else {
                    console.log("Error....", response);
                    setError({codeError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Server error:', error);
                setError({codeError: errorPageJson[5], heading: errorPageJson['1']});
            }

            setTimesRequested(prevState => prevState + 1);
            setTime(initialTime * timesRequested);

        })
    }

    function  handleSubmit (e){
        startTransition(async()=> {
            e.preventDefault();
            const formData = new FormData(e.target);
            const formCode = formData.get('verificationCode')
            setCodeRequested(false);
            sessionStorage.setItem('verificationCode', formCode);
            if (!isCodeValid(formCode)) {
                setError({codeError: errorPageJson[3], heading: errorPageJson['1']});
                return;
            }
            setError({codeError:null, heading:null});

            try {
                const response = await authService.emailVerification({
                    trxnId: state.userData.trxnId,
                    otp: formCode
                });
                console.log(response);
                if(response.status===204){
                    const userData = {...state.userData, emailValidated: true};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    navigate("/" + currentLang + NAVIGATION_LINKS.password);
                }else {
                    console.log("Error....", response);
                    setError({codeError: errorPageJson[5], heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({emailError:  errorPageJson[5], heading: errorPageJson['1']});
            }
        })
    }

    return (
        <GcdsContainer className="gcds-content" >
            <GcdsContainer>
                {
                    errorJson.codeError!==null&&(<GcdsErrorSummary
                        errorLinks={`{"#verificationCode": "${errorJson.codeError}"}`}
                        heading={errorJson.heading}
                    />)
                }
                {
                    codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['12']} data-testid="gcds-notice">
                        &nbsp;
                    </GcdsNotice>)
                }
                <GcdsContainer className="gcds-gap" >
                    <GcdsStepper currentStep="1" totalSteps="5"
                                 tag="h1"  >
                        {pageContentJson['1']}
                    </GcdsStepper>
                </GcdsContainer>
                <GcdsContainer>
                    <GcdsText>
                        {pageContentJson['2']} <strong>{state.userData.email}</strong>
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['3']}
                    </GcdsText>
                    <GcdsText>
                        {pageContentJson['4']}<strong>{pageContentJson['5']}</strong>
                    </GcdsText>
                    <form onSubmit={handleSubmit}>
                        <GcdsInput
                            inputId="verificationCode"
                            label={pageContentJson['6']}
                            name="verificationCode"
                            type="text"
                            validateOn="other"
                            value={sessionStorage.getItem('verificationCode')}
                            errorMessage={errorJson.codeError}
                            required ></GcdsInput>
                       <SubmitButton currentLang={currentLang} disabled={isPending}/>
                    </form>
                </GcdsContainer>
                <GcdsHeading tag="h2">
                    {pageContentJson['7']}
                </GcdsHeading>
                <GcdsContainer>
                    <GcdsText marginTop="200">
                        <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                            {pageContentJson['8']}
                        </GcdsLink>
                    </GcdsText>
                    <GcdsText>
                        {time>0 && !isPending?(<span>{pageContentJson['9']}<strong>{time} {pageContentJson['10']}</strong></span>)
                            :!isPending?(<GcdsLink href="#" onClick={requestNewCode} >
                                {pageContentJson['11']}
                              </GcdsLink>):""}
                    </GcdsText>
                </GcdsContainer>
            </GcdsContainer>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    );
}

