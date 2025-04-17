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
        "passwordMinAlphaChars": 0,
        "passwordMinOtherChars": 1,
        "pwdMinAge": 0,
        "pwdExpireWarning": 0,
        "pwdInHistory": 3,
        "pwdLockout": true,
        "pwdLockoutDuration": 15,
        "pwdMaxAge": 0,
        "pwdMaxFailure": 5,
        "pwdMinLength": 12,
        "pwdMaxLength": 65,
        "pwdCheckSyntax": 1
    }

}