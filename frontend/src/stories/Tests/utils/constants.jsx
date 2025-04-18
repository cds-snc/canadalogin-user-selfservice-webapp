import {SERVICES} from "../../../utils/constants.jsx";

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