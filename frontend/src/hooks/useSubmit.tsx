import {FormEvent, useTransition} from 'react';
import {CONTEXT_ACTIONS, FLOW_TYPES, GA_LABELS, PAGES, SUBMIT_END_POINTS} from "../utils/constants.jsx";
import {useUser} from "../components/Providers/useUser";
import {authService} from "../services/authService.jsx";
import {useNavigate} from "react-router";
import { trackEvent } from "../utils/gatag.jsx";

interface SubmitDataOptions {
    language: string,
    page: string,
    flow: string,
    type: string,
    endpoint: string,
    navigateTo: string,
    onError: (error: Error) => void
}

export function useSubmit(submitDataOptions:SubmitDataOptions, validateFunction:any ) {
    const {state, dispatch} = useUser();
    const navigate = useNavigate();
    const [isPending, startTransition] = useTransition();
    const handleSubmit =
        async (event: FormEvent<HTMLFormElement>) => {
            startTransition(async () => {
                event.preventDefault();
                try {
                    const formData = new FormData(event.currentTarget);
                    if (!validateObject(submitDataOptions.page, formData, validateFunction))
                        return;

                    const response = await callAuthService(submitDataOptions, formData, state.userData);
                    const userData = setUserData(submitDataOptions, formData, state.userData, response);
                    await dispatch({type: CONTEXT_ACTIONS.signUp, payload: userData});
                    await callAnalytics(submitDataOptions, "submit_success");
                    const navigateTo = setNavigateTo(submitDataOptions, response);
                    navigate(navigateTo);
                    return;
                } catch (error){
                    const serverMessage = error.response?.data?.message;
                    if(submitDataOptions.onError) {
                        submitDataOptions.onError(serverMessage);
                        if(serverMessage)
                            await callAnalytics(submitDataOptions, "submit_error");
                        else
                            await callAnalytics(submitDataOptions, "submit_timeout");
                    }
                }
           });
        }

    return {handleSubmit, isPending};
}

function setNavigateTo(submitDataOptions: SubmitDataOptions, response:any) {

    switch(submitDataOptions.flow+submitDataOptions.page) {
        case FLOW_TYPES.signIn+PAGES.password:
            return submitDataOptions.navigateTo+"/"+response.data.otpType;
        default:
            return submitDataOptions.navigateTo;
    }
}
async function callAnalytics(submitDataOptions: SubmitDataOptions, submitAction:string) {

    const action =  submitDataOptions.page.toLowerCase() + "_" + submitAction;

    trackEvent({
        category: submitDataOptions.flow,
        action: action,
        label: GA_LABELS.button
    });
}

async function callAuthService(submitDataOptions:SubmitDataOptions, formData:FormData, userData:any) {
    let payload = {};
    switch(submitDataOptions.endpoint){
        case(SUBMIT_END_POINTS.transientOtpSend):
            if(submitDataOptions.type === FLOW_TYPES.email)
                payload = {
                    userName: formData.get(FLOW_TYPES.email),
                    otpType: FLOW_TYPES.email
                };
            return await authService.transientOtpSend({...payload});
        case(SUBMIT_END_POINTS.create):
            payload = {
                userName: userData.email,
                password: formData.get('password')
            }
            return await authService.create({...payload});
        case(SUBMIT_END_POINTS.login):
            payload = {
                userName: userData.email,
                password: formData.get('password')
            }
            return await authService.login({...payload});
        default :
            return {};
    }
}

function setUserData(submitDataOptions:SubmitDataOptions, formData: FormData, userData:any, response:any) {

    switch (submitDataOptions.page) {
        case PAGES.signup:
            return  {
                ...userData, email: formData.get(FLOW_TYPES.email),
                emailLanguage: formData.get('language'), trxnId: response.data.trxnId
            }
        case PAGES.home:
            return {...userData, email: formData.get(FLOW_TYPES.email)};
        case PAGES.password:
            if(submitDataOptions.flow===FLOW_TYPES.signIn)
                return {...userData, passwordSubmitted: true, id: response.data.id};
            return {...userData, otpType: response.otpType, id: response.data.id};
        default:
            return {}
    }
}

function validateObject(page: string, formData:any, validateFunction: any) {
    switch(page){
        case PAGES.signup:
            return  validateFunction(formData.get(FLOW_TYPES.email));
        case PAGES.home:
            return  validateFunction(formData.get(FLOW_TYPES.email));
        case PAGES.password:
            return  validateFunction(formData.get('password'));
        default:
            return true;
    }
}