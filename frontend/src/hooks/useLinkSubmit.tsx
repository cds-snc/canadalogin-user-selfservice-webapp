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
                const analyticsTag = setTag(submitDataOptions, linkFlowType, changeType);
                try {
                    adjustEndpoint(linkFlowType, submitDataOptions);
                    const submitData = setSubmitData(submitDataOptions, state.userData, changeType);
                    const userData =  await callEndpoints(submitDataOptions, submitData, state.userData, linkFlowType);
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    await callAnalytics(submitDataOptions, analyticsTag+'_success', GA_LABELS.link);
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
                            await callAnalytics(submitDataOptions, analyticsTag+'_error', GA_LABELS.link);
                        else
                            await callAnalytics(submitDataOptions, analyticsTag+'_timeout', GA_LABELS.link);
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

async function callEndpoints(submitDataOptions: SubmitDataOptions, submitData: SubmitData, currentUserData: any, linkFlowType:string) {

    if(submitDataOptions.endpoints)
        for (const endpoint of submitDataOptions.endpoints) {
            const response = await callAuthService(submitDataOptions, submitData, currentUserData, endpoint);
            console.log("success....", response);
            currentUserData = setUserData(linkFlowType + submitDataOptions.type, currentUserData, response, submitData);
        }
    else
        currentUserData = setUserData(linkFlowType + submitDataOptions.type, currentUserData, {}, submitData);

    return currentUserData;
}

function setTag(submitDataOptions:SubmitDataOptions, linkFlowType:string, changeType:boolean) {

    if(linkFlowType===LINK_SUBMIT_TYPES.useNewVerification)
        return 'redirect_' + linkFlowType.toLowerCase() + '_' + submitDataOptions.type;
    else {
        const type = changeType?(submitDataOptions.type===FLOW_TYPES.sms?FLOW_TYPES.voice:FLOW_TYPES.sms):submitDataOptions.type;

        return 'submit_' + linkFlowType.toLowerCase() + '_'+ type;
    }
}
function setUserData(type:string, userData:any, response:any, submitData:SubmitData) {
    switch (type) {
        case LINK_SUBMIT_TYPES.useNewVerification+FLOW_TYPES.email:
            return {...userData, email: null};
        default:
            return {...userData, trxnId: response.data.trxnId, otpType: submitData.verificationType,};
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
        submitDataOptions.endpoints = null;
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