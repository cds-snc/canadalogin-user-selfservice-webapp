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
        }
    },
    thirdStep: async (userOtp, trxId, password) => {
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
        }
    },

    // update_my_user_profile: async (editedProfile) => {
    //     try {
    //         const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.profile}`, editedProfile);
    //         return response.data;
    //     }
    //     catch (error) {
    //         if (error.response && error.response.status === 401) {
    //             redirectToLogin();
    //         }
    //     }
    // },
    // get_rp_info: async (rp) => {
    //     try {
    //         const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.rp_info}/${rp}`);
    //         return response.data;
    //     }
    //     catch (error) {
    //         if (error.response && error.response.status === 401) {
    //             // redirectToLogin();
    //         }
    //     }
    // },
}