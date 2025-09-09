import axios from 'axios';
import config from '../../../config.jsx';
import { SUBMIT_END_POINTS } from "../../../utils/constants.jsx";
import { redirectToLogin } from "../../../utils/redirect.jsx";


axios.defaults.withCredentials = true;
const passwordUpdateApi = `${config.apiUrl}${SUBMIT_END_POINTS.passwordUpdate}`;

export const passwordUpdate = {
    firstStep: async (userName, otpMethod) => {
        try {
            const data = {
                "userName": userName,
                "otpMethod": otpMethod
            };

            const response = await axios.post(`${passwordUpdateApi}/initiate`, data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                redirectToLogin();
            }
            if (error.response) {
                throw error.response
            }
        }
    },
    secondStep: async (userOtp, trxId) => {
        try {
            const data = {
                "otp": userOtp,
                "trxId": trxId
            };

            const response = await axios.post(`${passwordUpdateApi}/validate`, data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                redirectToLogin();
            }
            if (error.response) {
                throw error.response
            }
        }
    },
    finalStep: async (userOtp, trxId, password) => {
        try {
            const data = {
                "otp": userOtp,
                "trxId": trxId,
                "password": password
            };

            const response = await axios.put(`${passwordUpdateApi}/complete`, data);
            return response.data;
        } catch (error) {
            if (error.response && error.response.status === 401) {
                redirectToLogin();
            }
            if (error.response) {
                throw error.response
            }
        }
    }
}