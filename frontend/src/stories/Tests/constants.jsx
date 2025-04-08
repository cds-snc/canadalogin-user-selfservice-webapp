import {SERVICES} from "../../utils/constants.jsx";

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
        password:null
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