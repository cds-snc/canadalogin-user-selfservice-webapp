import axios from "axios";
import config from "../../../../config";
import { handleApiError } from "../../../../utils/apiErrorHandler";
import { SUBMIT_END_POINTS } from "../../../../utils/constants";
import { ApiErrorLike } from "../../../../types/utils";

axios.defaults.withCredentials = true;

interface MFAEnrollParams {
  destination: string;
  otpType: string;
}

interface MFASendParams {
  id: string;
  otpType: string;
}

interface MFAVerifyParams {
  id: string;
  trxnId: string;
  otp: string;
  otpType: string;
}

export const addMFAPhoneNumberApi = {
  // Enroll a phone number for MFA OTP authentication
  enrollMFA: async ({
    destination,
    otpType,
  }: MFAEnrollParams): Promise<unknown> => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaEnroll}`,
        {
          destination,
          otpType,
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  // Send MFA OTP code via SMS or Voice
  sendMFAOTP: async ({ id, otpType }: MFASendParams): Promise<unknown> => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaSend}`,
        {
          id,
          otpType,
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  // Verify MFA OTP code
  verifyMFAOTP: async ({
    id,
    trxnId,
    otp,
    otpType,
  }: MFAVerifyParams): Promise<unknown> => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaVerify}`,
        {
          id,
          trxnId,
          otp,
          otpType,
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
