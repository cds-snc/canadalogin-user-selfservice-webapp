import axios from 'axios';
import config from '../../../config.jsx';
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { redirectToLogin } from "../../../utils/redirect.jsx";

axios.defaults.withCredentials = true;

export const handleApiError = (error) => {
    if (error.response?.status === 401) {
        redirectToLogin();
    }
    throw error.response || error;
};

export const transientOtp = {
    sendOtp: async (data) => {
        try {
            const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.transientOtpSend}`, data);
            return response.data;
        }
        catch (error) {
            handleApiError(error);
        }
    },
    verifyOtp: async (data) => {
        try {
            const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.transientOtpVerify}`, data);
            return response.data;
        }
        catch (error) {
            handleApiError(error);
        }
    },
}