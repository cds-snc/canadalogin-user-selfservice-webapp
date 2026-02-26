import axios from "../../../utils/axiosInstance";
import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";

export const otpFactors = {
  getUserOtpPhoneFactors: async (user_id) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
