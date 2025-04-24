import axios from 'axios';
import config from '../config';
import {SUBMIT_END_POINTS} from "../utils/constants.jsx";
import {ERROR_RESPONSE, TEST_RESPONSES,} from "../stories/Tests/utils/constants.jsx";
const testUsers = new Map([
    ['test@test.gc.ca', {emailOtp: '441234', smsOtp: '515136', voiceOtp: '151136'}],
]);


export const authService = {
    sendOtpCode: async (userData) => {

        if(testUsers.has(userData.userName))
            return buildTestResponse(userData, "sendOtpCode");

        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, userData);
        return response.data;
    },
    requestPasswordPolicy:async () => {
        const response = await axios.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`);
        return response.data;
    },
    create:async (userData) => {
        if(testUsers.has(userData.userName))
            return buildTestResponse(userData, "create");

        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.create}`, userData);
        return response.data;
    },
    sendTwoStepVerificationCode: async (userData) => {

        if(testUsers.has(userData.userName))
            return buildTestResponse(userData, "sendTwoStepVerificationCode");

        let endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCode;

        if(userData.verificationType==='voice')
            endpoint = SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice;
        else if(userData.verificationType==='email')
            endpoint = SUBMIT_END_POINTS.sendOtpCode;

        const response =  await axios.post(`${config.apiUrl}${endpoint}`, userData);

        return response.data;
    },
    twoStepVerification: async (userData) => {

        if(testUsers.has(userData.userName))
            return buildTestResponse(userData, "twoStepVerification");

        let endpoint = SUBMIT_END_POINTS.twoStepVerification;

        if(userData.verificationType==='voice')
            endpoint = SUBMIT_END_POINTS.twoStepVerificationVoice;
        else if(userData.verificationType==='email')
            endpoint = SUBMIT_END_POINTS.emailVerification;

        const response =  await axios.post(`${config.apiUrl}${endpoint}`, userData);

        return response.data;
    },
    createCoreProfile:async (userData) => {
        const response = await axios.post(`${config.apiUrl}${SUBMIT_END_POINTS.createCoreProfile}`, userData);
        return response.data;
    }
}

function buildTestResponse (userData, type) {
    console.log("Mocking "+type+" responses for user testing.");
    let response = null;
    const now = new Date();
    const expires = now;
    expires.setMinutes(now.getMinutes() + 5);
    switch (type) {
        case "sendOtpCode":
            response = TEST_RESPONSES.signUpResponse;
            response.data.emailAddress = userData.userName;
            response.data.created = now.toISOString();
            response.data.expiry =  expires.toISOString();

            return response;
        case "twoStepVerification":
            if(userData.verificationType==='email' && (userData.otp === testUsers.get(userData.userName).emailOtp))
                return TEST_RESPONSES.verificationEmailResponse;
            else if(userData.verificationType==='sms' && (userData.otp === testUsers.get(userData.userName).smsOtp))
                return TEST_RESPONSES.verificationSmsResponse;
            else if(userData.verificationType==='voice' && (userData.otp===testUsers.get(userData.userName).voiceOtp))
                return TEST_RESPONSES.verificationVoiceResponse;

            return ERROR_RESPONSE;
        case "sendTwoStepVerificationCode":
            if(userData.verificationType==='email') {
                response = TEST_RESPONSES.signUpResponse;
                response.data.emailAddress = userData.userName;
            }else if(userData.verificationType==='sms') {
                response = TEST_RESPONSES.verificationSmsSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }else{
                response = TEST_RESPONSES.verificationVoiceSetUpResponse;
                response.data.phoneNumber = userData.phoneNumber;
            }
            response.data.created = now.toISOString();
            response.data.expiry =  expires.toISOString();
            console.log(response);
            return response;
        case "create":
            response = TEST_RESPONSES.passwordResponse;
            response.data.userName = userData.userName;

            return response;
        default:
        {
            console.log("No case found for mocking")
            return response;
        }
    }
}