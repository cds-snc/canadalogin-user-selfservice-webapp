import axios from "../../../utils/axiosInstance";
import config from "../../../config";
import { SUBMIT_END_POINTS } from "../../../utils/constants";
import { handleApiError } from "../../../utils/apiErrorHandler";

export const otpFactors = {
  getUserOtpPhoneFactors: async (validated = true) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/otp_factors`,
        {
          params: {
            validated: validated,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
