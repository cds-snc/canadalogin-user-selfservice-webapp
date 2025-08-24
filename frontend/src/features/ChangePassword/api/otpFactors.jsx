import axios from 'axios';
import config from '../../../config.jsx';
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { redirectToLogin } from "../../../utils/redirect.jsx";

axios.defaults.withCredentials = true;

export const otpFactors = {
    getUserOtpNumber: async (user_id, otp_type) => {
        try {
            const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.users}/${user_id}/otp_factors/${otp_type}`);
            return response.data;
        }
        catch (error) {
            if (error.response && error.response.status === 401) {
                redirectToLogin();
            }
        }
    },
}