import axios from "axios";
import config from "../../../config.jsx";
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler.js";

axios.defaults.withCredentials = true;

export const otpFactors = {
  getUserOtpPhoneFactors: async (user_id, validated = true) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors`,
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
