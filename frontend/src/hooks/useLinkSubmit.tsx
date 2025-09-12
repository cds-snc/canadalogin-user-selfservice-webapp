import { useState, useTransition } from "react";
import {
  CONTEXT_ACTIONS,
  FLOW_TYPES,
  GA_LABELS,
  LINK_SUBMIT_TYPES,
  PAGES,
} from "../utils/constants.jsx";
import { useUser } from "../components/Providers/useUser";
import { useNavigate } from "react-router";
import {
  callAnalytics,
  callAuthService,
  SubmitData,
  SubmitDataOptions,
} from "./useSubmit";
import { path } from "../utils/routeHelpers.js";

export function useLinkSubmit(submitDataOptions: SubmitDataOptions) {
  const { state, dispatch } = useUser();
  const navigate = useNavigate();
  const [isPending, startTransition] = useTransition();
  const [codeRequested, setCodeRequested] = useState(false);
  const [timesRequested, setTimesRequested] = useState(2);

  const handleLinkSubmit = async (
    linkFlowType: string,
    changeType: boolean,
  ) => {
    startTransition(async () => {
      const analyticsTag = setTag(submitDataOptions, linkFlowType, changeType);
      try {
        adjustEndpoint(linkFlowType, submitDataOptions);
        const submitData = setSubmitData(
          submitDataOptions,
          state.userData,
          changeType,
        );
        const response = await callAuthService(
          submitDataOptions,
          submitData,
          state.userData,
        );
        console.log("success....", response);
        const userData = setUserData(
          linkFlowType + submitDataOptions.type,
          state.userData,
          response,
          submitData,
        );
        // Removed signUp dispatch since signup flows are removed
        await callAnalytics(
          submitDataOptions,
          analyticsTag + "_success",
          GA_LABELS.link,
        );
        const navigateTo = setNavigateTo(
          submitDataOptions,
          linkFlowType,
          changeType,
        );
        setStates(linkFlowType);
        if (navigateTo) navigate(navigateTo);

        return;
      } catch (error) {
        const serverMessage = error.response?.data?.message;
        if (submitDataOptions.onError) {
          submitDataOptions.onError(serverMessage);
          if (serverMessage)
            await callAnalytics(
              submitDataOptions,
              analyticsTag + "_error",
              GA_LABELS.link,
            );
          else
            await callAnalytics(
              submitDataOptions,
              analyticsTag + "_timeout",
              GA_LABELS.link,
            );
        }
      }
    });
  };

  function setStates(linkFlowType: string) {
    if (linkFlowType !== LINK_SUBMIT_TYPES.useNewVerification) {
      setCodeRequested(true);
      setTimesRequested((prevState: number) => prevState + 1);
    }
  }

  return { handleLinkSubmit, isPending, codeRequested, timesRequested };
}
function setTag(
  submitDataOptions: SubmitDataOptions,
  linkFlowType: string,
  changeType: boolean,
) {
  if (linkFlowType === LINK_SUBMIT_TYPES.useNewVerification)
    return (
      "redirect_" + linkFlowType.toLowerCase() + "_" + submitDataOptions.type
    );
  else {
    const type = changeType
      ? submitDataOptions.type === FLOW_TYPES.sms
        ? FLOW_TYPES.voice
        : FLOW_TYPES.sms
      : submitDataOptions.type;

    return "submit_" + linkFlowType.toLowerCase() + "_" + type;
  }
}
function setUserData(
  type: string,
  userData: any,
  response: any,
  submitData: SubmitData,
) {
  switch (type) {
    case LINK_SUBMIT_TYPES.useNewVerification + FLOW_TYPES.email:
      return { ...userData, email: null };
    default:
      return {
        ...userData,
        trxId: response.trxId,
        otpType: submitData.verificationType,
      };
  }
}

function setSubmitData(
  submitDataOptions: SubmitDataOptions,
  userData: any,
  changeType: boolean,
) {
  return {
    email: userData.email,
    language: userData.language,
    verificationCode: null,
    password: null,
    phone: userData.phone,
    verificationType: changeType
      ? submitDataOptions.type === FLOW_TYPES.sms
        ? FLOW_TYPES.voice
        : FLOW_TYPES.sms
      : submitDataOptions.type,
    firstName: null,
    lastName: null,
  };
}
function adjustEndpoint(
  linkFlowType: string,
  submitDataOptions: SubmitDataOptions,
) {
  if (linkFlowType === LINK_SUBMIT_TYPES.useNewVerification)
    submitDataOptions.endpoint = null;
}
function setNavigateTo(
  submitDataOptions: SubmitDataOptions,
  linkFlowType: string,
  changeType: boolean,
) {
  const verificationLink = path(PAGES.verification, {
    language: submitDataOptions.language,
  });
  const verificationPath = "/verification";

  switch (linkFlowType) {
    case LINK_SUBMIT_TYPES.useNewVerification:
      return verificationLink;
    case LINK_SUBMIT_TYPES.requestNewCode:
      if (changeType) {
        const newType =
          submitDataOptions.type === FLOW_TYPES.sms
            ? FLOW_TYPES.voice
            : FLOW_TYPES.sms;
        return (
          "/" +
          submitDataOptions.language +
          "/" +
          submitDataOptions.flow +
          verificationPath +
          "/" +
          newType
        );
      }

      return null;
  }
}
