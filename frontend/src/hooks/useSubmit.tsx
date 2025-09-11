import { FormEvent, useTransition } from "react";
import {
  CONTEXT_ACTIONS,
  FLOW_TYPES,
  GA_LABELS,
  PAGES,
  SUBMIT_END_POINTS,
} from "../utils/constants.jsx";
import { useUser } from "../components/Providers/useUser";
import { authService } from "../services/authService.jsx";
import { useNavigate } from "react-router";
import { trackEvent } from "../utils/gatag.jsx";

export interface SubmitDataOptions {
  language: string;
  page: string;
  flow: string;
  type: string;
  endpoint: string;
  navigateTo: string;
  onError: (error: Error) => void;
}

export interface SubmitData {
  email: string;
  language: string;
  verificationCode: string;
  password: string;
  phone: string;
  verificationType: string;
  firstName: string;
  lastName: string;
}

export function useSubmit(
  submitDataOptions: SubmitDataOptions,
  validateFunction: any,
) {
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    startTransition(async () => {
      event.preventDefault();
      try {
        const submitData = setSubmitData(new FormData(event.currentTarget));
        if (
          !validateObject(submitDataOptions.page, submitData, validateFunction)
        )
          return;

        const response = await callAuthService(
          submitDataOptions,
          submitData,
          state.userData,
        );
        console.log("success....", response);
        await callAnalytics(
          submitDataOptions,
          submitDataOptions.type + "_submit_success",
          GA_LABELS.button,
        );
        const navigateTo = setNavigateTo(
          submitDataOptions,
          response,
          submitData,
        );
        navigate(navigateTo);
        return;
      } catch (error) {
        console.log("error....", error);
        const serverMessage = error.response?.data?.message;
        if (submitDataOptions.onError) {
          submitDataOptions.onError(serverMessage);
          if (serverMessage)
            await callAnalytics(
              submitDataOptions,
              submitDataOptions.type + "submit_error",
              GA_LABELS.button,
            );
          else
            await callAnalytics(
              submitDataOptions,
              submitDataOptions.type + "submit_timeout",
              GA_LABELS.button,
            );
        }
      }
    });
  };

  return { handleSubmit, isPending };
}
function setSubmitData(formData: FormData) {
  const submitData = {
    email: null,
    language: null,
    verificationCode: null,
    password: null,
    phone: null,
    verificationType: null,
    firstName: null,
    lastName: null,
  };

  formData.forEach((value, key) => (submitData[key] = value));

  return submitData;
}

function setNavigateTo(
  submitDataOptions: SubmitDataOptions,
  response: any,
  submitData: SubmitData,
) {
  switch (submitDataOptions.flow + submitDataOptions.page) {
    default:
      return submitDataOptions.navigateTo;
  }
}
export async function callAnalytics(
  submitDataOptions: SubmitDataOptions,
  submitAction: string,
  label: string,
) {
  const action = submitDataOptions.page.toLowerCase() + "_" + submitAction;

  trackEvent({
    category: submitDataOptions.flow,
    action: action,
    label: label,
  });
}

export async function callAuthService(
  submitDataOptions: SubmitDataOptions,
  submitData: SubmitData,
  userData: any,
) {
  let payload = {};
  switch (submitDataOptions.endpoint) {
    case SUBMIT_END_POINTS.create:
      payload = {
        userName: userData.email,
        password: submitData.password,
        trxnId: userData.trxnId,
      };
      return await authService.create({ ...payload });
    case SUBMIT_END_POINTS.login:
      payload = {
        userName: userData.email,
        password: submitData.password,
      };
      return await authService.login({ ...payload });
    case SUBMIT_END_POINTS.otpVerify:
      payload = {
        otp: submitData.verificationCode,
        otpType: submitDataOptions.type,
        userName: userData.email,
        trxnId: userData.trxnId,
      };
      return await authService.otpVerify({ ...payload });
    case SUBMIT_END_POINTS.otpSend:
      payload = {
        userName: userData.email,
        otpType: userData.otpType,
        phone: userData.phone,
      };
      return await authService.otpSend({ ...payload });
    case SUBMIT_END_POINTS.createCoreProfile:
      payload = {
        userName: userData.email,
        firstName: submitData.firstName,
        lastName: submitData.lastName,
        id: userData.id,
        language: userData.emailLanguage,
      };
      return await authService.createCoreProfile({ ...payload });
    default:
      return {};
  }
}

function setUserData(
  submitDataOptions: SubmitDataOptions,
  submitData: SubmitData,
  userData: any,
  response: any,
) {
  switch (submitDataOptions.page) {
    case PAGES.password:
      return {
        ...userData,
        otpType: response.data.otpType,
        id: response.data.id,
        phone: response.data.phone,
        passwordValidated: true,
      };
    case PAGES.verificationSetUp:
      return {
        ...userData,
        phone: submitData.phone,
        stepVerificationSent: true,
        trxnId: response.data.trxnId,
      };
    case PAGES.verification:
      return { ...userData, stepVerified: true };
    case PAGES.privacy:
      return { ...userData, viewPrivacy: true };
    default:
      return { ...userData };
  }
}

function validateObject(
  page: string,
  submitData: SubmitData,
  validateFunction: any,
) {
  switch (page) {
    case PAGES.signup:
      return validateFunction(submitData.email);
    case PAGES.password:
      return validateFunction(submitData.password);
    case PAGES.verificationSetUp:
      return validateFunction();
    case PAGES.coreProfile:
      return validateFunction(submitData.firstName, submitData.lastName);
    case PAGES.verification:
      return validateFunction(submitData.verificationCode);
    default:
      return true;
  }
}
