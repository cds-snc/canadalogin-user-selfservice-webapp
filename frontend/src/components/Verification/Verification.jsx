import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent, isCodeValid} from '../../utils/functions.jsx';
import AlreadyGc from "../Layout/AlreadyGc.jsx";
import {
    AVAILABLE_LANGUAGES,
    CONTEXT_ACTIONS,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    SERVICES
} from "../../utils/constants.jsx";
import {useNavigate, useParams} from "react-router";
import SubmitButton from "../Layout/SubmitButton.jsx";
import {useUser} from "../Providers/UserContext.jsx";
import {authService} from "../../services/authService.jsx";
import {useEffect, useState, useTransition} from "react";

const initialTime=10;

export default function Verification() {
    const {type, flow,language} = useParams();
    const {state, dispatch} = useUser();
    const [isPending, startTransition] = useTransition();
    const [time, setTime] = useState(initialTime);
    const [codeRequested, setCodeRequested] = useState(false);
    const [timesRequested, setTimesRequested] = useState(2);
    const [errorJson, setError] = useState({heading: null, codeError:null});
    const navigate = useNavigate();
    const errorPageJson = getPageContent(language, "Error");
    const pageContentJson = getPageContent(language, "Verification");

    useEffect(()=>{
        if(time<=0)
            return;

        const timer = setTimeout(()=>{
            setTime((prevTime) => prevTime-1);
        },1000);

        return () => clearTimeout(timer);

    },[time]);

    async function useNewNumber(){
        setError({codeError:null, heading:null});
        const userData = {...state.userData, phone:null, stepVerificationSent: false, trxnId:null};
        await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
        navigate("/" + language + NAVIGATION_LINKS.twoStepVerification);
    }

    async function requestSameTypeCode (e){
        setError({codeError:null, heading:null});

        startTransition(async()=> {
            e.preventDefault();
            await requestNewCode(type, false);
        })
    }

    function requestNewTypeCode(e){
        setError({codeError:null, heading:null});

        startTransition(async()=> {
            e.preventDefault();
            const newType =  type===FLOW_TYPES.voice?FLOW_TYPES.sms:FLOW_TYPES.voice
            await requestNewCode(newType, true);
        })
    }

    async function requestNewCode(codeType, didTypeChange){
        setError({codeError:null, heading:null});
        try {
            const response = await authService.sendTwoStepVerificationCode({
                phoneNumber: state.userData.phone.replace(/\D/g,''),
                verificationType: codeType
            });

            if(response.success){
                const userData = {...state.userData, trxnId:response.data.trxnId};
                await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                setCodeRequested(true);
                if(didTypeChange)
                    navigate("/" + language +"/"+ flow +NAVIGATION_LINKS.verification + '/' +codeType)
            }else {
                console.log("Error....", response);
                setError({codeError: response.message, heading: errorPageJson['1']});
            }
        } catch (error) {
            console.error('Server error:', error);
            setError({codeError: errorPageJson[7], heading: errorPageJson['1']});
        }

        setTimesRequested(prevState => prevState + 1);
        setTime(initialTime * timesRequested);
    }

    function  handleSubmit (e){
        startTransition(async()=> {
            e.preventDefault();

            const formData = new FormData(e.target);
            const formCode = formData.get('verificationCode')
            setCodeRequested(false);
            if (!isCodeValid(formCode)) {
                setError({codeError: errorPageJson[3], heading: errorPageJson['1']});
                return;
            }
            setError({codeError:null, heading:null});

            try {
                const response = await authService.twoStepVerification({
                    otp: formCode,
                    verificationType: type,
                    flow: flow,
                    trxnId: state.userData.trxnId
                });
                if(response.success){
                    if(flow===FLOW_TYPES.signUp) {
                        const userData = {...state.userData, stepVerified: true};
                        await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                        console.log("success...sign up", response)
                        navigate("/" + language + NAVIGATION_LINKS.coreProfile);
                    }else if(flow===FLOW_TYPES.signIn){
                        const userData = {...state.userData, stepVerified: true};
                        await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                        console.log("success...sign in", response)
                        navigate("/" + language + '/redirecttorp');
                    }
                }else {
                    console.log("Error....", response);
                    setError({codeError: response.message, heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({codeError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

    return (
        <GcdsContainer className="gcds-content" >
            {
                errorJson.codeError!==null&&(
                    <GcdsErrorSummary
                        errorLinks={`{"#verificationCode": "${errorJson.codeError}"}`}
                        heading={errorJson.heading}
                        data-testid="errorSummary"
                    />)
            }
            {codeRequested &&(<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['17']} data-testid="linkSuccess">&nbsp;</GcdsNotice>)}
            {
                flow===FLOW_TYPES.signIn&&(
                    <GcdsHeading tag="h1">
                        {pageContentJson['18']}
                        <GcdsText marginTop="150" marginBottom="0">
                            {pageContentJson['19']}
                            <strong>
                                {language===AVAILABLE_LANGUAGES.fr?' '+pageContentJson['20']+' ':''}
                                {` ${SERVICES[0].title}`}{language===AVAILABLE_LANGUAGES.en?' '+pageContentJson['20']:''}
                            </strong>
                        </GcdsText>
                    </GcdsHeading>

                )
            }
            {
                flow===FLOW_TYPES.signUp&&(
                    <GcdsContainer className="gcds-gap" >
                        <GcdsStepper currentStep="3"
                                     totalSteps="4"
                                     tag="h1"
                                     lang={language}>
                                    {pageContentJson['1']}
                        </GcdsStepper>
                    </GcdsContainer>
                )
            }
            {
                flow===FLOW_TYPES.signIn&&(
                    <GcdsHeading tag="h2">
                        {pageContentJson['1']}
                    </GcdsHeading>
                )
            }
            <GcdsContainer>
                <GcdsText>
                    {type===FLOW_TYPES.voice?pageContentJson['3']:pageContentJson['2']}&nbsp;<strong>{state.userData.phone}</strong>
                </GcdsText>
                <GcdsText>
                    {type===FLOW_TYPES.voice?pageContentJson['5']:pageContentJson['4']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['6']} <strong>{pageContentJson['7']}</strong>
                </GcdsText>
                {
                    flow===FLOW_TYPES.signIn&&(
                        <GcdsText>
                            <GcdsLink href="#" onClick={useNewNumber}>
                                {pageContentJson['21']}
                            </GcdsLink>
                        </GcdsText>
                    )
                }
                <GcdsHeading tag='h2'>
                    {pageContentJson['8']}
                </GcdsHeading>
                <form id="form"  onSubmit={handleSubmit}>
                    {
                        state.testData!==undefined&&(<GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['9']}
                        name="verificationCode"
                        value={state.testData.otp}
                        type="text"
                        validateOn="other"
                        errorMessage={errorJson.codeError}
                        lang={language}
                        required ></GcdsInput>)
                    }
                    {
                        state.testData===undefined&&(<GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['9']}
                        name="verificationCode"
                        type="text"
                        validateOn="other"
                        errorMessage={errorJson.codeError}
                        lang={language}
                        required ></GcdsInput>)
                    }
                    <SubmitButton currentLang={language} disabled={isPending}/>
                </form>
            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['10']}
            </GcdsHeading>
            {
                flow===FLOW_TYPES.signUp&&(
                    <GcdsText>
                        <GcdsLink href="#" onClick={useNewNumber}>
                            {pageContentJson['13']}
                        </GcdsLink>
                    </GcdsText>
                )
            }
            <GcdsText>
                {time<=0 && !isPending?(<GcdsLink href="#" onClick={requestNewTypeCode}>
                        {type===FLOW_TYPES.voice?pageContentJson['12']:pageContentJson['11']}
                    </GcdsLink>):""}
            </GcdsText>
            <GcdsText>
                {time>0 && !isPending?(<span>{pageContentJson['14']}<strong> {time} {pageContentJson['15']}</strong></span>)
                    :!isPending?(<GcdsLink href="#" onClick={requestSameTypeCode} >
                        {pageContentJson['16']}
                    </GcdsLink>):""}
            </GcdsText>
            {flow===FLOW_TYPES.signUp&&(<AlreadyGc currentLang={language}/>)}
        </GcdsContainer>
    )
}