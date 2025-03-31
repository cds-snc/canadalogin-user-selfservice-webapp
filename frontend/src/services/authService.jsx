import axios from 'axios';
import config from '../config';
import {SUBMIT_END_POINTS} from "../utils/constants.jsx";

export const authService = {
    sendOtpCode: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, userData);
        return response.data;
    },
    emailVerification: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.emailVerification}`, userData);
        return response.data;
    },
    requestPasswordPolicy:async () => {
        const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`);
        return response.data;
    },
    create:async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.create}`, userData);
        return response.data;
    },
    sendTwoStepVerificationCode: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendTwoStepVerification}`, userData);
        return response.data;
    }
}
