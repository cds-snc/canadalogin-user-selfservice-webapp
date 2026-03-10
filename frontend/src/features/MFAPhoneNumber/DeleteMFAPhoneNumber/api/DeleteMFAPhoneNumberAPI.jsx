import axios from "axios";
import config from "../../../../config.jsx";
import { handleApiError } from "../../../../utils/apiErrorHandler";
import { SUBMIT_END_POINTS } from "../../../../utils/constants";

axios.defaults.withCredentials = true;

export const deleteMFAPhoneNumberApi = {
  // Delete an MFA OTP phone number with OTP verification
  deleteMFA: async ({ id, otpType, otp, trxnId, otpVerificationType }) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaDelete}`,
        {
          data: {
            id,
            otpType,
            otp,
            trxnId,
            otpVerificationType,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
