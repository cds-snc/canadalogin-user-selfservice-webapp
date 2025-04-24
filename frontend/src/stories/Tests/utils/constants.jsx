import {SERVICES, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
export const testUsers = new Map([
    ['test@test.gc.ca', {emailOtp: '441234', smsOtp: '515136', voiceOtp: '151136'}],
]);
export const TestDataUserProvider = {
    isAuthenticated: false,
    userData: {
        service: SERVICES[0].title, //to be set later when url referrer is given, also need to refactor other pages to use this value
        language: 'en', //to be set later when refactoring possibly
        email: null,
        emailLanguage: null,
        emailValidated: false,
        trxnId: null,
        passwordSubmitted:false
    },
    testData:{
        email: null,
        otp: null,
        phone: null,
        verificationCode: null,
        password:null,
        firstname: null,
        lastName: null
    }
}

export const ACTION_TYPES = {
    link: 'Link',
    submit: 'Submit'
}

export const TEST_TYPES = {
    error: 'Error',
    success: 'Success',
    redirect: 'Redirect',
}

export const POLICY_RESPONSE = {
    "success": true,
    "message": "Password policy retrieved successfully",
    "data": {
            "pwdMinLength": 12,
            "pwdMaxLength": 65
    }
}

export const SUCCESS_RESPONSE = {
    "success": true,
    "message": "OTP sent successfully",
    "data": {
        "trxnId": "eac50d6d-c2d9-47ef-a3ad-7ddc27d683b1",
        "type": "emailotp",
        "created": "2025-03-28T16:48:21.561Z",
        "updated": "2025-03-28T16:48:21.561Z",
        "expiry": "2025-03-28T16:53:21.561Z",
        "state": "PENDING",
        "correlationID": "7322",
        "emailAddress": "test@test.com",
        "attempts": 0,
        "retries": 4
    }
}

export const ERROR_RESPONSE = {
    "success": false,
    "message": "The system cannot process the request at this time",
    "data": null
};

export const MSW_PASSWORD_POLICY = {type:"get", endpoint: SUBMIT_END_POINTS.requestPasswordPolicy, response:POLICY_RESPONSE }
export const MSW_VERIFICATION = {
    signin: {
        verification: {
            sms: {
                error: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerification, response: ERROR_RESPONSE},
                success: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerification, response: SUCCESS_RESPONSE}
            },
            voice: {
                error: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice, response: ERROR_RESPONSE},
                success: {type: "post",
                    endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice,
                    response: SUCCESS_RESPONSE
                }
            },
            requestNewCode: {
                sms: {
                    success: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode,
                        response: SUCCESS_RESPONSE
                    },
                    error: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode,
                        response: ERROR_RESPONSE
                    }
                },
                voice: {
                    success: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                        response: SUCCESS_RESPONSE
                    },
                    error: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                        response: ERROR_RESPONSE
                    }
                },
                serverTimeOut: {
                    type: "post",
                    endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                    response: null
                }
            },
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice, response: null}
        }
    },
    signup:{
        coreProfile:{
            error:{type: "post", endpoint: SUBMIT_END_POINTS.createCoreProfile, response: ERROR_RESPONSE},
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.createCoreProfile, response: null},
            success: {type: "post", endpoint: SUBMIT_END_POINTS.createCoreProfile, response: SUCCESS_RESPONSE}
        },
        verificationSetUp:{
            error:{type: "post", endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode, response: ERROR_RESPONSE},
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode, response: null},
            success: {type: "post", endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode, response: SUCCESS_RESPONSE}
        },
        password:{
            error:{type: "post", endpoint: SUBMIT_END_POINTS.create, response: ERROR_RESPONSE},
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.create, response: null},
            success: {type: "post", endpoint: SUBMIT_END_POINTS.create, response: SUCCESS_RESPONSE}
        },
        signUp:{
            error:{type: "post", endpoint: SUBMIT_END_POINTS.sendOtpCode, response: ERROR_RESPONSE},
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.sendOtpCode, response: null},
            success: {type: "post", endpoint: SUBMIT_END_POINTS.sendOtpCode, response: SUCCESS_RESPONSE}
        },
        verification: {
            email: {
                error: {type: "post", endpoint: SUBMIT_END_POINTS.emailVerification, response: ERROR_RESPONSE},
                success: {type: "post", endpoint: SUBMIT_END_POINTS.emailVerification, response: SUCCESS_RESPONSE}
            },
            sms: {
                error: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerification, response: ERROR_RESPONSE},
                success: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerification, response: SUCCESS_RESPONSE}
            },
            voice: {
                error: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice, response: ERROR_RESPONSE},
                success: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice, response: SUCCESS_RESPONSE}
            },
            requestNewCode: {
                email: {
                    success: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendOtpCode,
                        response: SUCCESS_RESPONSE
                    },
                    error: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendOtpCode,
                        response: ERROR_RESPONSE
                    }
                },
                sms: {
                    success: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode,
                        response: SUCCESS_RESPONSE
                    },
                    error: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCode,
                        response: ERROR_RESPONSE
                    }
                },
                voice: {
                    success: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                        response: SUCCESS_RESPONSE
                    },
                    error: {
                        type: "post",
                        endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                        response: ERROR_RESPONSE
                    }
                },
                serverTimeOut: {
                    type: "post",
                    endpoint: SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
                    response: null
                }
            },
            serverTimeOut: {type: "post", endpoint: SUBMIT_END_POINTS.twoStepVerificationVoice, response: null}
        }
    }
}


export const TEST_RESPONSES = {
    signUpResponse: {
        success: true,
        message: 'OTP sent successfully',
        data:{
            attempts: 0,
            correlationID: "3995",
            created: "2025-04-23T11:55:43.872Z",
            emailAddress: "test@test.com",
            expiry: "2025-04-23T12:00:43.872Z",
            retries: 4,
            state: "PENDING",
            trxnId: "b3cea5a1-1e96-43d6-a4d0-0c5ba8beaa19",
            type: "emailotp",
            updated: "2025-04-23T11:55:43.872Z"
        }
    },
    verificationEmailResponse: {
        success: true,
        message: 'Email OTP has been validated',
        data: null
    },
    passwordResponse: {
        success: true,
        message: 'User created successfully',
        data: {
            id: '772001COT4',
            userName: 'test@test.com'
        }
    },
    verificationSmsSetUpResponse: {
        success: true,
        message: 'SMS OTP sent successfully',
        data: {
            attempts: 0,
            correlationID: "4711",
            created: "2025-04-23T12:12:56.916Z",
            phoneNumber: "14161234567",
            expiry: "2025-04-23T12:00:43.872Z",
            retries: 4,
            state: "PENDING",
            trxnId: "776aab11-e3e6-4e9d-981e-abafca74a077",
            type: "smsotp",
            updated: "2025-04-23T12:17:56.916Z"
        }
    },
    verificationVoiceSetUpResponse: {
        success: true,
        message: 'Voice OTP sent successfully',
        data: {
            attempts: 0,
            correlationID: "4711",
            created: "2025-04-23T12:12:56.916Z",
            phoneNumber: "14161234567",
            expiry: "2025-04-23T12:00:43.872Z",
            retries: 4,
            state: "PENDING",
            trxnId: "776aab11-e3e6-4e9d-981e-abafca74a077",
            type: "voiceotp",
            updated: "2025-04-23T12:17:56.916Z"
        }
    },
    verificationSmsResponse: {
        success: true,
        message: 'Transient sms OTP has been validated',
        data: null
    },
    verificationVoiceResponse: {
        success: true,
        message: 'Transient voice OTP has been validated',
        data: null
    }
}

