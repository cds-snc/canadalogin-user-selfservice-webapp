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
    transientOtpSend: async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "transientOtpSend");

        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.transientOtpSend}`, userData);
        return response.data;
    },
    transientOtpVerify: async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "transientOtpVerify");

        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.transientOtpVerify}`, userData);
        return response.data;
    },
    createCoreProfile:async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return SUCCESS_RESPONSE;

        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`, userData);
        return response.data;
    },
    //logic will need to be updated once backend has been completed
    login:async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "login");
        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.login}`, userData);
        return response.data;
    },
    otpSend: async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "otpSend");

        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.otpSend}`, userData);
        return response.data;
    },
    otpVerify: async (userData) => {
        if(TEST_USERS.has(userData.userName))
            return buildTestResponse(userData, "otpVerify");

        const response =  await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.otpVerify}`, userData);
        return response.data;
    },
}

function buildTestResponse (userData, type) {
    console.log("Mocking "+type+" responses for user testing.");
    let response = null;
    const now = new Date();
    const expires = new Date();
    switch (type) {
        case "transientOtpVerify":
            if(userData.otpType===FLOW_TYPES.email && (userData.otp === TEST_USERS.get(userData.userName).emailOtp))
                return TEST_RESPONSES.verificationEmailResponse;
            else if(userData.otpType===FLOW_TYPES.sms && (userData.otp === TEST_USERS.get(userData.userName).smsOtp))
                return TEST_RESPONSES.verificationSmsResponse;
            else if(userData.otpType===FLOW_TYPES.voice && (userData.otp===TEST_USERS.get(userData.userName).voiceOtp))
                return TEST_RESPONSES.verificationVoiceResponse;

            return ERROR_RESPONSE;
        case "transientOtpSend":
            if(userData.otpType===FLOW_TYPES.email) {
                response = TEST_RESPONSES.signUpResponse;
                response.data.phoneNumber = null;
            }else if(userData.otpType===FLOW_TYPES.voice) {
                response = TEST_RESPONSES.verificationVoiceSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }else{
                response = TEST_RESPONSES.verificationSmsSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }

            response.data.emailAddress = userData.userName;
            expires.setMinutes(expires.getMinutes() + 5);
            response.data.created = now.toISOString();
            response.data.expiry =  expires.toISOString();

            return response;
        case "otpVerify":
            if(userData.otpType===FLOW_TYPES.sms && (userData.otp === TEST_USERS.get(userData.userName).smsOtp))
                return TEST_RESPONSES.verificationSmsResponse;
            else if(userData.otpType===FLOW_TYPES.voice && (userData.otp===TEST_USERS.get(userData.userName).voiceOtp))
                return TEST_RESPONSES.verificationVoiceResponse;

            return ERROR_RESPONSE;
        case "otpSend":
            if(userData.otpType===FLOW_TYPES.voice) {
                response = TEST_RESPONSES.verificationVoiceSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }else{
                response = TEST_RESPONSES.verificationSmsSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }

            response.data.emailAddress = userData.userName;
            expires.setMinutes(expires.getMinutes() + 5);
            response.data.created = now.toISOString();
            response.data.expiry =  expires.toISOString();

            return response;
        case "create":
            response = TEST_RESPONSES.passwordResponse;
            response.data.userName = userData.userName;
            return response;
        case 'login':
           if(userData.password===TEST_USERS.get(userData.userName).login) {
                response = SUCCESS_RESPONSE;
                response.data.id = '155151-68967896-997097';
                response.data.phone = '+1(***) ***-1234'
                response.data.otpType = FLOW_TYPES.sms;
                return response;
           }
           return ERROR_RESPONSE;


    }
}