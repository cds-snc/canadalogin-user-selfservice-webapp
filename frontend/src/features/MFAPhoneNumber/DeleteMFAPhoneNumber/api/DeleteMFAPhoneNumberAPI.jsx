import axios from "axios";
import config from "../../../../config.jsx";
import { handleApiError } from "../../../../utils/apiErrorHandler.js";
import { SUBMIT_END_POINTS } from "../../../../utils/constants.jsx";

axios.defaults.withCredentials = true;

export const deleteMFAPhoneNumberApi = {
  // Delete an MFA OTP phone number
  deleteMFA: async ({ id, otpType }) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}${SUBMIT_END_POINTS.mfaDelete}`,
        {
          data: {
            id,
            otpType,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
