import axios from 'axios';
import config from '../config';
import { FLOW_TYPES, SUBMIT_END_POINTS, OIDC_REDIRECT } from "../utils/constants.jsx";
import { redirectToLogin } from "../utils/redirect.jsx";
import {
    ERROR_RESPONSE, TEST_PROTOTYPES,
    SUCCESS_RESPONSE,
    TEST_RESPONSES,
    TEST_USERS,
    VALIDATION_CODE_ERROR_RESPONSE
} from "../stories/Tests/utils/constants.jsx";

axios.defaults.withCredentials = true;

export const authService = {
    requestPasswordPolicy: async () => {
        const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`);
        return response.data;
    },

    update_my_user_profile: async (editedProfile) => {
        try {
            const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.profile}`, editedProfile);
            return response.data;
        }
        catch (error) {
            if (error.response && error.response.status === 401) {
                redirectToLogin();
            }
        }
    },
    get_rp_info: async (rp) => {
        try {
            const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.rp_info}/${rp}`);
            return response.data;
        }
        catch (error) {
            if (error.response && error.response.status === 401) {
                // redirectToLogin();
            }
        }
    },
}