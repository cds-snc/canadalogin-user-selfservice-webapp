import axios from "axios";
import config from "../../../config.jsx";
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler.js";

axios.defaults.withCredentials = true;

export const updateLinkStateAPI = {
  // not sure we need user_id, just the legacy PAI. Or send the token back to API to ensure no tampering (validate token then pull sub from it)
  submitLegacyPAI: async (user_id) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  submitSkipLinking: async (user_id) => {
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
