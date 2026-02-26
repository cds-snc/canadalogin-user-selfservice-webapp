import axios from "../../../../utils/axiosInstance";
import config from "../../../../config";
import { handleApiError } from "../../../../utils/apiErrorHandler";
import { SUBMIT_END_POINTS } from "../../../../utils/constants";

export const addMFAPhoneNumberApi = {
  // Enroll a phone number for MFA OTP authentication
  enrollMFA: async ({ destination, otpType }) => {
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
      handleApiError(error);
    }
  },

  // Send MFA OTP code via SMS or Voice
  sendMFAOTP: async ({ id, otpType }) => {
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
      handleApiError(error);
    }
  },

  // Verify MFA OTP code
  verifyMFAOTP: async ({ id, trxnId, otp, otpType }) => {
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
      handleApiError(error);
    }
  },
};
