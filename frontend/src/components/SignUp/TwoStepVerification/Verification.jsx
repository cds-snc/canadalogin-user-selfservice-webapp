import {
    GcdsContainer, GcdsErrorSummary, GcdsHeading, GcdsInput,
    GcdsLink, GcdsNotice,
    GcdsStepper,
    GcdsText
} from "@cdssnc/gcds-components-react";
import {getPageContent} from '../../../utils/functions';
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

    async function requestNewCode (e){
        setError({codeError:null, heading:null});

        startTransition(async()=> {
            e.preventDefault();
            try {
                const response = await authService.sendTwoStepVerificationCode({
                    phoneNumber: state.userData.phone,
                    verificationType: 'sms'
                });
                console.log(response);
                if(response.success){
                    const userData = {
                        ...state.userData,
                        stepVerificationSent: true,
                        trxnId:response.data.trxnId
                    };
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    setCodeRequested(true);
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

        })
    }

    async function useNewNumber(){
        const userData = {...state.userData, phone:formData.get('phone'), stepVerificationSent: true, trxnId:response.data.trxnId};
        await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
        console.log("success....", state);
        navigate("/" + currentLang + NAVIGATION_LINKS.verification+'/'+formType);
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
                codeRequested && (<GcdsNotice type="success" noticeTitleTag="h2" noticeTitle={pageContentJson['16']}>
                    &nbsp;
                </GcdsNotice>)
            }
            <GcdsContainer className="gcds-gap" >
                <GcdsStepper currentStep="3" totalSteps="5"
                             tag="h1"
                             lang={currentLang}>
                    {pageContentJson['1']}
                </GcdsStepper>
            </GcdsContainer>
            <GcdsContainer>
                <GcdsText>
                    {pageContentJson['2']}&nbsp;<strong>{state.userData.phone}</strong>
                </GcdsText>
                <GcdsText>
                    {type==='voice'?pageContentJson['4']:pageContentJson['3']}
                </GcdsText>
                <GcdsText>
                    {pageContentJson['5']} <strong>{pageContentJson['6']}</strong>
                </GcdsText>
                <GcdsHeading tag='h2'>
                    {pageContentJson['7']}
                </GcdsHeading>
                <form>
                    <GcdsInput
                        inputId="verificationCode"
                        label={pageContentJson['8']}
                        name="verificationCode"
                        type="text"
                        lang={currentLang}
                        required ></GcdsInput>
                    <SubmitButton currentLang={currentLang} />
                </form>
            </GcdsContainer>
            <GcdsHeading tag='h2'>
                {pageContentJson['9']}
            </GcdsHeading>
            <GcdsText>
                <GcdsLink href={`/${currentLang}${NAVIGATION_LINKS.signUp}`} >
                    {type==='voice'?pageContentJson['11']:pageContentJson['10']}
                </GcdsLink>
            </GcdsText>
            <GcdsText>
                <GcdsLink href="#" onClick={useNewNumber}  >
                    {pageContentJson['12']}
                </GcdsLink>
            </GcdsText>
            <GcdsText>
                {time>0 && !isPending?(<span>{pageContentJson['13']}<strong> {time} {pageContentJson['14']}</strong></span>)
                    :!isPending?(<GcdsLink href="#" onClick={requestNewCode} >
                        {pageContentJson['15']}
                    </GcdsLink>):""}
            </GcdsText>
            <AlreadyGc currentLang={currentLang}/>
        </GcdsContainer>
    )
}