import axios from "axios";

import config from "../config";
import {
  FLOW_TYPES,
  RP_CLIENT_ID_KEY,
  SUBMIT_END_POINTS,
} from "../utils/constants";
import { handleApiError } from "../utils/apiErrorHandler";
import type {
  AuthServiceContract,
  AuthServiceError,
  AuthServiceResponse,
  LogoutResponseData,
  OtpRequestPayload,
  PasswordPolicyData,
  RelyingPartyData,
  SessionKeepAliveData,
  UpdateEmailPayload,
  UpdatePhonePayload,
  UserPayload,
} from "../types/services";

import {
  ERROR_RESPONSE,
  SUCCESS_RESPONSE,
  TEST_PROTOTYPES,
  TEST_RESPONSES,
  TEST_USERS,
  VALIDATION_CODE_ERROR_RESPONSE,
} from "../stories/Tests/utils/constants";

axios.defaults.withCredentials = true;

export const authService: AuthServiceContract = {
  requestPasswordPolicy: async () => {
    try {
      const response = await axios.get<AuthServiceResponse<PasswordPolicyData>>(
        `${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  create: async (userData) => {
    if (TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "create");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.create}`,
      userData,
    );
    return response.data;
  },
  transientOtpSend: async (userData) => {
    if (userData.userName && TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "transientOtpSend");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpSend}`,
      userData,
    );
    return response.data;
  },
  transientOtpVerify: async (userData) => {
    if (userData.userName && TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "transientOtpVerify");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpVerify}`,
      userData,
    );
    return response.data;
  },
  createCoreProfile: async (userData) => {
    if (TEST_USERS.has(userData.userName)) {
      openPrototypeWindow("signUpRedirect");
      return SUCCESS_RESPONSE;
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`,
      userData,
    );
    return response.data;
  },
  login: async (userData) => {
    if (TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "login");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.login}`,
      userData,
    );
    return response.data;
  },
  otpSend: async (userData) => {
    if (userData.userName && TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "otpSend");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.otpSend}`,
      userData,
    );
    return response.data;
  },
  otpVerify: async (userData) => {
    if (userData.userName && TEST_USERS.has(userData.userName)) {
      return buildTestResponse(userData, "otpVerify");
    }

    const response = await axios.post<AuthServiceResponse>(
      `${config.apiUrl}${SUBMIT_END_POINTS.otpVerify}`,
      userData,
    );
    return response.data;
  },
  get_my_user_profile: async (rpClientId) => {
    let profileUrl = `${config.apiUrl}${SUBMIT_END_POINTS.profile}`;
    if (rpClientId) {
      profileUrl += `?${RP_CLIENT_ID_KEY}=${encodeURIComponent(rpClientId)}`;
    }

    // Do NOT use handleApiError here. A 401 on initial page load is expected (e.g.
    // after logout) and should be handled silently so PrivateRoute can decide the
    // correct redirect (including prompt=login after deliberate logout).
    const response = await axios.get<AuthServiceResponse>(profileUrl);
    return response.data;
  },
  update_my_user_profile: async (editedProfile) => {
    try {
      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.profile}`,
        editedProfile,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  update_email_with_otp: async (
    newEmailAddress,
    otp,
    trxnId,
    otpType = "email",
  ) => {
    try {
      const updatePayload: UpdateEmailPayload = {
        newEmailAddress,
        otp,
        trxnId,
        otpType,
      };

      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.profileUpdateWithOtp}`,
        updatePayload,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  update_phone_with_otp: async (phoneNumber, otp, trxnId, otpType = "sms") => {
    try {
      const updatePayload: UpdatePhonePayload = {
        phoneNumbers: [{ value: phoneNumber, type: "mobile" }],
        otp,
        trxnId,
        otpType,
      };

      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.profileUpdateWithOtp}`,
        updatePayload,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  get_rp_info: async () => {
    try {
      const response = await axios.get<AuthServiceResponse<RelyingPartyData>>(
        `${config.apiUrl}${SUBMIT_END_POINTS.rp_info}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  logout: async (returnToPage) => {
    try {
      const logoutUrl = new URL(
        `${config.apiUrl}${SUBMIT_END_POINTS.logout}`,
        window.location.origin,
      );
      if (returnToPage) {
        logoutUrl.searchParams.set("returnToPage", returnToPage);
      }

      const response = await axios.post<
        AuthServiceResponse<LogoutResponseData>
      >(logoutUrl.toString());
      const returnedUrl = response.data?.data?.redirect_url;

      if (response.status === 200 && returnedUrl) {
        const postUrl = new URL(returnedUrl);
        const params = Object.fromEntries(postUrl.searchParams.entries());

        const form = document.createElement("form");
        form.method = "POST";
        form.action = postUrl.origin + postUrl.pathname;

        Object.entries(params).forEach(([key, value]) => {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = key;
          input.value = value;
          form.appendChild(input);
        });

        document.body.appendChild(form);
        sessionStorage.setItem("post_logout", "true");
        HTMLFormElement.prototype.submit.call(form);
      }

      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  keepAlive: async () => {
    try {
      const response = await axios.post<
        AuthServiceResponse<SessionKeepAliveData>
      >(`${config.apiUrl}${SUBMIT_END_POINTS.keepAlive}`);
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  verifyPassword: async ({ password }) => {
    try {
      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.passwordVerify}`,
        { password },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
  verifyPasswordForStepup: async ({ password }) => {
    try {
      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}${SUBMIT_END_POINTS.passwordVerifyStepup}`,
        { password },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as AuthServiceError);
    }
  },
};

function buildTestResponse(
  userData: UserPayload | OtpRequestPayload,
  type: string,
): AuthServiceResponse {
  console.log("Mocking " + type + " responses for user testing.");
  let response: AuthServiceResponse | null = null;
  const now = new Date();
  const expires = new Date();
  const userName = userData.userName ?? "";

  switch (type) {
    case "transientOtpVerify":
      if (
        userData.otpType === FLOW_TYPES.email &&
        userData.otp === TEST_USERS.get(userName)?.emailOtp
      ) {
        return TEST_RESPONSES.verificationEmailResponse;
      }

      if (
        userData.otpType === FLOW_TYPES.sms &&
        userData.otp === TEST_USERS.get(userName)?.smsOtp
      ) {
        return TEST_RESPONSES.verificationSmsResponse;
      }

      if (
        userData.otpType === FLOW_TYPES.voice &&
        userData.otp === TEST_USERS.get(userName)?.voiceOtp
      ) {
        return TEST_RESPONSES.verificationVoiceResponse;
      }

      throw { response: VALIDATION_CODE_ERROR_RESPONSE };
    case "transientOtpSend":
      if (userData.otpType === FLOW_TYPES.email) {
        response = TEST_RESPONSES.signUpResponse;
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).phoneNumber = null;
        }
      } else if (userData.otpType === FLOW_TYPES.voice) {
        response = TEST_RESPONSES.verificationVoiceSetUpResponse;
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).phoneNumber =
            userData.phoneNumber;
        }
      } else {
        response = TEST_RESPONSES.verificationSmsSetUpResponse;
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).phoneNumber =
            userData.phoneNumber;
        }
      }

      if (response.data && typeof response.data === "object") {
        (response.data as Record<string, unknown>).emailAddress = userName;
        expires.setMinutes(expires.getMinutes() + 5);
        (response.data as Record<string, unknown>).created = now.toISOString();
        (response.data as Record<string, unknown>).expiry =
          expires.toISOString();
      }
      openPrototypeWindow(
        typeof userData.otpType === "string" ? userData.otpType : "",
      );

      return response;
    case "otpVerify":
      if (
        userData.otpType === FLOW_TYPES.sms &&
        userData.otp === TEST_USERS.get(userName)?.smsOtp
      ) {
        TEST_RESPONSES.verificationSmsResponse.message =
          "Sign in sms OTP has been validated";
        return TEST_RESPONSES.verificationSmsResponse;
      }

      if (
        userData.otpType === FLOW_TYPES.voice &&
        userData.otp === TEST_USERS.get(userName)?.voiceOtp
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
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).phoneNumber =
            userData.phoneNumber;
        }
      } else {
        response = TEST_RESPONSES.verificationSmsSetUpResponse;
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).phoneNumber =
            userData.phoneNumber;
        }
      }

      if (response.data && typeof response.data === "object") {
        (response.data as Record<string, unknown>).emailAddress = userName;
        expires.setMinutes(expires.getMinutes() + 5);
        (response.data as Record<string, unknown>).created = now.toISOString();
        (response.data as Record<string, unknown>).expiry =
          expires.toISOString();
      }

      return response;
    case "create":
      response = TEST_RESPONSES.passwordResponse;
      if (response.data && typeof response.data === "object") {
        (response.data as Record<string, unknown>).userName = userName;
      }
      return response;
    case "login":
      if (
        (userData as UserPayload).userName &&
        userData.password === TEST_USERS.get(userName)?.login
      ) {
        response = SUCCESS_RESPONSE;
        if (response.data && typeof response.data === "object") {
          (response.data as Record<string, unknown>).id =
            "155151-68967896-997097";
          (response.data as Record<string, unknown>).phone = "+1(***) ***-1234";
          (response.data as Record<string, unknown>).otpType = FLOW_TYPES.sms;
        }
        return response;
      }
      return ERROR_RESPONSE;
    default:
      return ERROR_RESPONSE;
  }
}

function openPrototypeWindow(otpType: string): void {
  const prototypeUrlsMap = TEST_PROTOTYPES.get(otpType);
  if (!prototypeUrlsMap) {
    return;
  }

  const targetUrl = isMobileMediaQuery()
    ? prototypeUrlsMap.mobileUrl
    : prototypeUrlsMap.desktopUrl;

  window.open(targetUrl, "_blank")?.focus();
  console.log(
    `${isMobileMediaQuery() ? "Mobile" : "Non-mobile"} device detected for ${otpType}`,
  );
}

export function isMobileMediaQuery(): boolean {
  try {
    return window.matchMedia("(max-width: 767px)").matches;
  } catch (error) {
    console.log((error as Error).message);
    return false;
  }
}
