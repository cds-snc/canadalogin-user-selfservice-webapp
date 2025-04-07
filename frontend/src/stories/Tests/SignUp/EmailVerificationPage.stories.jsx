import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../constants.jsx";
import EmailVerificationPage from "../../../views/SignUp/EmailVerificationPage.jsx";
import {storyParameters, testCase} from "../functions.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent('en', "EmailVerification");
const frPageContentJson = getPageContent('fr', "EmailVerification");

const serverError =  "The system cannot process the request because the verification code was not found.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "Verification code sent successfully",
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

TestDataUserProvider.userData.email = "test@test.com";

export default {

    title: 'GC Sign In/Tests/Sign Up/Email Verification Page',
    component: EmailVerificationPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};


const BadTemplateFE = (args) =>   {

    TestDataUserProvider.testData.otp = "12154e";

    return(
        <UserProvider initial={TestDataUserProvider}><EmailVerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const TemplateBE = (args) =>   {

    TestDataUserProvider.testData.otp = "123456";

    return(
        <UserProvider initial={TestDataUserProvider}><EmailVerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngErrorFrontEnd = BadTemplateFE.bind({});
export const FrErrorFrontEnd = BadTemplateFE.bind({});
export const ErrorBackEnd = TemplateBE.bind({});
export const SuccessfulBackEnd = TemplateBE.bind({});
export const ServerErrorBackEnd = TemplateBE.bind({});
export const EngRequestNewCode = TemplateBE.bind({});
export const FrRequestNewCode = TemplateBE.bind({});
export const RequestNewCodeError = TemplateBE.bind({});
export const RequestNewCodeNoResponse = TemplateBE.bind({});

EngErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail);
EngErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad code in English",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail);
FrErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad code in French",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification, errorResponse);
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })

}

SuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification, successResponse);
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good code",
        link: 'verificationCode',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })

}

ServerErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification, null);
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, successResponse);
EngRequestNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[12],
        linkText: engPageContentJson[11],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}

FrRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, successResponse);
FrRequestNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: frPageContentJson[12],
        linkText: frPageContentJson[11],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}

RequestNewCodeError.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, errorResponse);
RequestNewCodeError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Unsuccessful resend code.",
        link: 'verificationCode',
        message: serverError,
        linkText: engPageContentJson[11],
        heading: engErrorPageJson[1],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}

RequestNewCodeNoResponse.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, null);
RequestNewCodeNoResponse.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "No Response on resend code.",
        link: 'verificationCode',
        message: engErrorPageJson[7],
        linkText: engPageContentJson[11],
        isFail: true,
        heading: engErrorPageJson[1],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}









