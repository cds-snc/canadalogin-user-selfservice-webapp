import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent, isCodeValid} from '../../../utils/functions';
import AlreadyGc from "../../Layout/AlreadyGc.jsx";
import {CONTEXT_ACTIONS, NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import {useNavigate, useParams} from "react-router";
import SubmitButton from "../../Layout/SubmitButton.jsx";
import {useUser} from "../../Providers/UserContext.jsx";
import {authService} from "../../../services/authService.jsx";
import {useEffect, useState, useTransition} from "react";

const initialTime=10;

export default function Verification({currentLang}) {
    const {type} = useParams();
    const {state, dispatch} = useUser();
    const [isPending, startTransition] = useTransition();
    const [time, setTime] = useState(initialTime);
    const [codeRequested, setCodeRequested] = useState(false);
    const [timesRequested, setTimesRequested] = useState(2);
    const [errorJson, setError] = useState({heading: null, codeError:null});
    const navigate = useNavigate();
    const errorPageJson = getPageContent(currentLang, "Error");
    const pageContentJson = getPageContent(currentLang, "Verification");

    useEffect(()=>{
        if(time<=0)
            return;

        const timer = setTimeout(()=>{
            setTime((prevTime) => prevTime-1);
        },1000);

        return () => clearTimeout(timer);

    },[time]);

    async function useNewNumber(){
        const userData = {...state.userData, phone:null, stepVerificationSent: false, trxnId:null};
        await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
        navigate("/" + currentLang + NAVIGATION_LINKS.twoStepVerification);
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
            const newType =  type==='voice'?'sms':'voice'
            await requestNewCode(newType, true);
        })
    }

    async function requestNewCode(codeType, didTypeChange){

        try {
            const response = await authService.sendTwoStepVerificationCode({
                phoneNumber: state.userData.phone,
                verificationType: codeType
            });

            if(response.success){
                setCodeRequested(true);
                if(didTypeChange)
                    navigate("/" + currentLang + NAVIGATION_LINKS.verification+'/'+codeType)
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
                    trxnId: state.userData.trxnId
                });
                if(response.success){
                    const userData = {...state.userData, stepVerified: true};
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    console.log("success...",response)
                    navigate("/" + currentLang + NAVIGATION_LINKS.coreProfile);
                }else {
                    console.log("Error....", response);
                    setError({codeError: errorPageJson[7], heading: errorPageJson['1']});
                }
            } catch (error) {
                console.error('Signup error:', error);
                setError({emailError:  errorPageJson[7], heading: errorPageJson['1']});
            }
        })
    }

    return (
        <GcdsContainer className="gcds-content" >
            {
                errorJson.codeError!==null&&(<GcdsErrorSummary
                    errorLinks={`{"#verificationCode": "${errorJson.codeError}"}`}
                    heading={errorJson.heading}
                />)
            }
            {
                codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['17']}>
                    &nbsp;
                </GcdsNotice>)
            }
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep="3" totalSteps="4"
                             tag="h1"
                             lang={currentLang}>
                    {pageContentJson['1']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsText>
                    {type==='voice'?pageContentJson['3']:pageContentJson['2']}&nbsp;<strong>{state.userData.phone}</strong>
                </GcdsText>
                <GcdsText>
                    {type==='voice'?pageContentJson['5']:pageContentJson['4']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['6']} <strong>{pageContentJson['7']}</strong>
                </GcdsText>
                <GcdsHeading tag='h2'>
                    {pageContentJson['8']}
                </GcdsHeading>
                <form onSubmit={handleSubmit}>
                    <GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['9']}
                        name="verificationCode"
                        type="text"
                        lang={currentLang}
                        required ></GcdsInput>
                    <SubmitButton currentLang={currentLang} disabled={isPending}/>
                </form>
            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['10']}
            </GcdsHeading>
            <GcdsText>
                {time<=0 && !isPending?(<GcdsLink href="#" onClick={requestNewTypeCode} >
                        {type==='voice'?pageContentJson['12']:pageContentJson['11']}
                    </GcdsLink>):""}
            </GcdsText>
            <GcdsText>
                <GcdsLink href="#" onClick={useNewNumber}  >
                    {pageContentJson['13']}
                </GcdsLink>
            </GcdsText>
            <GcdsText>
                {time>0 && !isPending?(<span>{pageContentJson['14']}<strong> {time} {pageContentJson['15']}</strong></span>)
                    :!isPending?(<GcdsLink href="#" onClick={requestSameTypeCode} >
                        {pageContentJson['16']}
                    </GcdsLink>):""}
            </GcdsText>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}