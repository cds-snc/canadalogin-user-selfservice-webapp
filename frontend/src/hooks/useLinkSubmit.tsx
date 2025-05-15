import {useState, useTransition} from 'react';
import {CONTEXT_ACTIONS, FLOW_TYPES, GA_LABELS, LINK_SUBMIT_TYPES, NAVIGATION_LINKS,} from "../utils/constants.jsx";
import {useUser} from "../components/Providers/useUser";
import {useNavigate} from "react-router";
import {callAnalytics, callAuthService, SubmitData, SubmitDataOptions} from "./useSubmit";


export function useLinkSubmit(submitDataOptions:SubmitDataOptions) {
    const {state, dispatch} = useUser();
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();
    const [codeRequested, setCodeRequested] = useState(false);
    const [timesRequested, setTimesRequested] = useState(2);

    const handleLinkSubmit =
        async (linkFlowType:string, changeType:boolean) => {
            startTransition(async () => {
                try {
                    adjustEndpoint(linkFlowType, submitDataOptions);
                    const submitData =setSubmitData(submitDataOptions, state.userData, changeType);
                    const response = await callAuthService(submitDataOptions, submitData, state.userData);
                    console.log("success....", response);
                    const userData = setUserData(linkFlowType+submitDataOptions.type, state.userData, response, submitData);
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    const navigateTo = setNavigateTo(submitDataOptions, linkFlowType, changeType);
                    setStates(linkFlowType);
                    if(navigateTo)
                        navigate(navigateTo);

                    return;
                } catch (error){
                    const serverMessage = error.response?.data?.message;
                    if(submitDataOptions.onError) {
                        submitDataOptions.onError(serverMessage);
                        if(serverMessage)
                            await callAnalytics(submitDataOptions, "submit_error", GA_LABELS.link);
                        else
                            await callAnalytics(submitDataOptions, "submit_timeout", GA_LABELS.link);
                    }
                }
            });
        }

    function setStates(linkFlowType:string) {
        if(linkFlowType!==LINK_SUBMIT_TYPES.useNewVerification) {
            setCodeRequested(true);
            setTimesRequested((prevState: number) => prevState + 1);
        }
    }

    return {handleLinkSubmit, isPending, codeRequested, timesRequested};
}

function setUserData(type:string, userData:any, response:any, submitData:SubmitData) {
    switch (type) {
        case LINK_SUBMIT_TYPES.useNewVerification+FLOW_TYPES.email:
            return {...userData, email: null};
        default:
            return {...userData, trxId: response.trxId, otpType: submitData.verificationType,};
    }
}

function setSubmitData(submitDataOptions:SubmitDataOptions, userData:any, changeType:boolean) {
    return {
        email: userData.email,
        language: userData.language,
        verificationCode: null,
        password: null,
        phone: userData.phone,
        verificationType: changeType ? submitDataOptions.type === FLOW_TYPES.sms ? FLOW_TYPES.voice : FLOW_TYPES.sms : submitDataOptions.type,
        firstName: null,
        lastName: null
    };
}
function adjustEndpoint(linkFlowType:string, submitDataOptions:SubmitDataOptions) {
    if(linkFlowType===LINK_SUBMIT_TYPES.useNewVerification)
        submitDataOptions.endpoint = null;
}
function setNavigateTo(submitDataOptions:SubmitDataOptions, linkFlowType:string, changeType:boolean) {

    switch (linkFlowType) {
        case LINK_SUBMIT_TYPES.useNewVerification:
            if(submitDataOptions.type===FLOW_TYPES.email)
                return ("/" + submitDataOptions.language + NAVIGATION_LINKS.signUp);
            else if(submitDataOptions.flow===FLOW_TYPES.signUp)
                return ("/" + submitDataOptions.language + NAVIGATION_LINKS.twoStepVerification);

            return ("/" + submitDataOptions.language + NAVIGATION_LINKS.verificationSelection);
        case LINK_SUBMIT_TYPES.requestNewCode:
            if(changeType) {
                const newType = submitDataOptions.type===FLOW_TYPES.sms?FLOW_TYPES.voice:FLOW_TYPES.sms;
                return ("/" + submitDataOptions.language + '/' + submitDataOptions.flow + NAVIGATION_LINKS.verification + '/' + newType);
            }

            return null;
    }
}