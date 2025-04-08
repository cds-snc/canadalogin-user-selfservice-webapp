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
        let response = null;

        if(userData.verificationType==='voice')
            response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice}`, userData);
        else
            response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendTwoStepVerificationCode}`, userData);

        return response.data;
    },
    twoStepVerification: async (userData) => {
        let response = null;

        if(userData.verificationType==='voice')
            response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.twoStepVerificationVoice}`, userData);
        else
            response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.twoStepVerification}`, userData);

        return response.data;
    },
    createCoreProfile:async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`, userData);
        return response.data;
    }
}
