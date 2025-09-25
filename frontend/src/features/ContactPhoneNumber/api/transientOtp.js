import axios from "axios";
import config from "../../../config.jsx";
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler.js";

axios.defaults.withCredentials = true;

export const transientOtp = {
  sendOtp: async (data) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpSend}`,
        data,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
  verifyOtp: async (data) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}${SUBMIT_END_POINTS.transientOtpVerify}`,
        data,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
