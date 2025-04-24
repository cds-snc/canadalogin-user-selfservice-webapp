import axios from 'axios';
import config from '../config';
import {FLOW_TYPES, SUBMIT_END_POINTS} from "../utils/constants.jsx";
import {ERROR_RESPONSE, SUCCESS_RESPONSE, TEST_RESPONSES, TEST_USERS} from "../stories/Tests/utils/constants.jsx";

export const authService = {
    requestPasswordPolicy:async () => {
        const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`);
        return response.data;
    },
    create:async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "create");

        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.create}`, userData);
        return response.data;
    },
    sendTwoStepVerificationCode: async (userData) => {

        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "sendTwoStepVerificationCode");

        let endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCode;

        if(userData.verificationType===FLOW_TYPES.voice)
            endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice;
        else if(userData.verificationType===FLOW_TYPES.email)
            endpoint = SUBMIT_END_POINTS.sendOtpCode;

        const response =  await axios.post(`${config.apiUrl}${endpoint}`, userData);

        return response.data;
    },
    twoStepVerification: async (userData) => {

        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "twoStepVerification");

        let endpoint = SUBMIT_END_POINTS.twoStepVerification;

        if(userData.verificationType===FLOW_TYPES.voice)
            endpoint = SUBMIT_END_POINTS.twoStepVerificationVoice;
        else if(userData.verificationType===FLOW_TYPES.email)
            endpoint = SUBMIT_END_POINTS.emailVerification;

        const response =  await axios.post(`${config.apiUrl}${endpoint}`, userData);

        return response.data;
    },
    createCoreProfile:async (userData) => {
        //const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`, userData);
        return SUCCESS_RESPONSE;
    }
}

function buildTestResponse (userData, type) {
    console.log("Mocking "+type+" responses for user testing.");
    let response = null;

    switch (type) {
        case "twoStepVerification":
            if(userData.verificationType===FLOW_TYPES.email && (userData.otp === TEST_USERS.get(userData.userName).emailOtp))
                return TEST_RESPONSES.verificationEmailResponse;
            else if(userData.verificationType===FLOW_TYPES.sms && (userData.otp === TEST_USERS.get(userData.userName).smsOtp))
                return TEST_RESPONSES.verificationSmsResponse;
            else if(userData.verificationType===FLOW_TYPES.voice && (userData.otp===TEST_USERS.get(userData.userName).voiceOtp))
                return TEST_RESPONSES.verificationVoiceResponse;

            return ERROR_RESPONSE;
        case "sendTwoStepVerificationCode":
            if(userData.verificationType===FLOW_TYPES.email) {
                response = TEST_RESPONSES.signUpResponse;
                response.data.emailAddress = userData.userName;
            }else if(userData.verificationType===FLOW_TYPES.voice) {
                response = TEST_RESPONSES.verificationVoiceSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }else{
                response = TEST_RESPONSES.verificationSmsSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }
            const now = new Date();
            const expires =new Date();
            expires.setMinutes(expires.getMinutes() + 5);
            response.data.created = now.toISOString();
            response.data.expiry =  expires.toISOString();

            return response;
        case "create":
            response = TEST_RESPONSES.passwordResponse;
            response.data.userName = userData.userName;
            return response;
    }
}