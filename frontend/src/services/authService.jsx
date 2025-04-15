import axios from 'axios';
import config from '../config';
import {SUBMIT_END_POINTS} from "../utils/constants.jsx";

export const authService = {
    sendOtpCode: async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, userData);
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

        let endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCode;

        if(userData.verificationType==='voice')
            endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice;
        else if(userData.verificationType==='email')
            endpoint = SUBMIT_END_POINTS.sendOtpCode;

        const response =  await axios.post(`${config.apiUrl}${endpoint}`, userData);

        return response.data;
    },
    twoStepVerification: async (userData) => {

        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.otpVerify}`, userData);

        return response.data;
    },
    createCoreProfile:async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`, userData);
        return response.data;
    }
}
