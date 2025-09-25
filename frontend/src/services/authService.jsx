import axios from "axios";
import config from "../config";
import {
  FLOW_TYPES,
  SUBMIT_END_POINTS,
  RP_CLIENT_ID_KEY,
} from "../utils/constants.jsx";
import { handleApiError } from "../utils/apiErrorHandler.js";

import {
  ERROR_RESPONSE,
  TEST_PROTOTYPES,
  SUCCESS_RESPONSE,
  TEST_RESPONSES,
  TEST_USERS,
  VALIDATION_CODE_ERROR_RESPONSE,
} from "../stories/Tests/utils/constants.jsx";

axios.defaults.withCredentials = true;

export const authService = {
  requestPasswordPolicy: async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  create: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "create");

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.create}`,
      userData,
    );
    return response.data;
  },
  transientOtpSend: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "transientOtpSend");

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpSend}`,
      userData,
    );
    return response.data;
  },
  transientOtpVerify: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "transientOtpVerify");

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpVerify}`,
      userData,
    );
    return response.data;
  },
  createCoreProfile: async (userData) => {
    if (TEST_USERS.has(userData.userName)) {
      //for un-moderated testing purposes
      openPrototypeWindow("signUpRedirect");
      return SUCCESS_RESPONSE;
    }

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`,
      userData,
    );
    return response.data;
  },
  //logic will need to be updated once backend has been completed
  login: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "login");
    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.login}`,
      userData,
    );
    return response.data;
  },
  otpSend: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "otpSend");

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.otpSend}`,
      userData,
    );
    return response.data;
  },
  otpVerify: async (userData) => {
    if (TEST_USERS.has(userData.userName))
      return buildTestResponse(userData, "otpVerify");

    const response = await axios.post(
      `${config.apiUrl}${SUBMIT_END_POINTS.otpVerify}`,
      userData,
    );
    return response.data;
  },

  get_my_user_profile: async (rp_client_id) => {
    let profileUrl = `${config.apiUrl}${SUBMIT_END_POINTS.profile}`;
    if (rp_client_id) {
      profileUrl += `?${RP_CLIENT_ID_KEY}=${encodeURIComponent(rp_client_id)}`;
    }

    try {
      const response = await axios.get(profileUrl);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  update_my_user_profile: async (editedProfile) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.profile}`,
        editedProfile,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  get_rp_info: async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.rp_info}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  logout: async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.logout}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  keepAlive: async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.keepAlive}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};

function buildTestResponse(userData, type) {
  console.log("Mocking " + type + " responses for user testing.");
  let response = null;
  const now = new Date();
  const expires = new Date();
  switch (type) {
    case "transientOtpVerify":
      if (
        userData.otpType === FLOW_TYPES.email &&
        userData.otp === TEST_USERS.get(userData.userName).emailOtp
      )
        return TEST_RESPONSES.verificationEmailResponse;
      else if (
        userData.otpType === FLOW_TYPES.sms &&
        userData.otp === TEST_USERS.get(userData.userName).smsOtp
      )
        return TEST_RESPONSES.verificationSmsResponse;
      else if (
        userData.otpType === FLOW_TYPES.voice &&
        userData.otp === TEST_USERS.get(userData.userName).voiceOtp
      )
        return TEST_RESPONSES.verificationVoiceResponse;

      throw { response: VALIDATION_CODE_ERROR_RESPONSE };
    case "transientOtpSend":
      if (userData.otpType === FLOW_TYPES.email) {
        response = TEST_RESPONSES.signUpResponse;
        response.data.phoneNumber = null;
      } else if (userData.otpType === FLOW_TYPES.voice) {
        response = TEST_RESPONSES.verificationVoiceSetUpResponse;
        response.data.phoneNumber = userData.phoneNumber;
      } else {
        response = TEST_RESPONSES.verificationSmsSetUpResponse;
        response.data.phoneNumber = userData.phoneNumber;
      }

      response.data.emailAddress = userData.userName;
      expires.setMinutes(expires.getMinutes() + 5);
      response.data.created = now.toISOString();
      response.data.expiry = expires.toISOString();
      //for un-moderated testing purposes
      openPrototypeWindow(userData.otpType);

      return response;
    case "otpVerify":
      if (
        userData.otpType === FLOW_TYPES.sms &&
        userData.otp === TEST_USERS.get(userData.userName).smsOtp
      ) {
        TEST_RESPONSES.verificationSmsResponse.message =
          "Sign in sms OTP has been validated";
        return TEST_RESPONSES.verificationSmsResponse;
      } else if (
        userData.otpType === FLOW_TYPES.voice &&
        userData.otp === TEST_USERS.get(userData.userName).voiceOtp
      ) {
        TEST_RESPONSES.verificationVoiceResponse.message =
          "Sign in voice OTP has been validated";
        return TEST_RESPONSES.verificationVoiceResponse;
      }

      throw { response: VALIDATION_CODE_ERROR_RESPONSE };
    case "otpSend":
      console.log("sending for ", userData.otpType);
      if (userData.otpType === FLOW_TYPES.voice) {
        response = TEST_RESPONSES.verificationVoiceSetUpResponse;
        response.data.phoneNumber = userData.phoneNumber;
      } else {
        response = TEST_RESPONSES.verificationSmsSetUpResponse;
        response.data.phoneNumber = userData.phoneNumber;
      }

      response.data.emailAddress = userData.userName;
      expires.setMinutes(expires.getMinutes() + 5);
      response.data.created = now.toISOString();
      response.data.expiry = expires.toISOString();

      return response;
    case "create":
      response = TEST_RESPONSES.passwordResponse;
      response.data.userName = userData.userName;
      return response;
    case "login":
      if (userData.password === TEST_USERS.get(userData.userName).login) {
        response = SUCCESS_RESPONSE;
        response.data.id = "155151-68967896-997097";
        response.data.phone = "+1(***) ***-1234";
        response.data.otpType = FLOW_TYPES.sms;
        return response;
      }
      return ERROR_RESPONSE;
  }
}

function openPrototypeWindow(otpType) {
  const prototypeUrlsMap = TEST_PROTOTYPES.get(otpType);
  if (isMobileMediaQuery()) {
    // Code for mobile devices
    window.open(prototypeUrlsMap.mobileUrl, "_blank").focus();
    console.log("Mobile device detected for " + otpType);
  } else {
    // Code for non-mobile devices
    window.open(prototypeUrlsMap.desktopUrl, "_blank").focus();
    console.log("Non-mobile device detected for " + otpType);
  }
}

export function isMobileMediaQuery() {
  try {
    return window.matchMedia("(max-width: 767px)").matches;
  } catch (error) {
    console.log(error.message);
    return false;
  }
}
