import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../constants.jsx";
import {storyParameters, testCase} from "../functions.jsx";
import VerificationPage from "../../../views/SignUp/VerificationPage.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent('en', "Verification");
const frPageContentJson = getPageContent('fr', "Verification");

const serverError =  "The system cannot process the request because the verification was not found.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
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

export default {

    title: 'GC Sign In/Tests/Sign Up/Verification Page',
    component: VerificationPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

TestDataUserProvider.userData.phone = '+1 (416) 123 - 4567';

const BadTemplateFE = (args) =>   {

    TestDataUserProvider.testData.otp = "12154e";
    return(
        <UserProvider initial={TestDataUserProvider}><VerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const TemplateBE = (args) =>   {

    TestDataUserProvider.testData.otp = "123456";

    return(
        <UserProvider initial={TestDataUserProvider}><VerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngErrorFrontEnd = BadTemplateFE.bind({});
export const FrErrorFrontEnd = BadTemplateFE.bind({});
export const SmsErrorBackEnd = TemplateBE.bind({});
export const SmsSuccessfulBackEnd = TemplateBE.bind({});
export const VoiceErrorBackEnd = TemplateBE.bind({});
export const VoiceSuccessfulBackEnd = TemplateBE.bind({});
export const ServerErrorBackEnd = TemplateBE.bind({});
export const EngRequestNewCode = TemplateBE.bind({});
export const FrRequestNewCode = TemplateBE.bind({});
export const EngRequestNewTypeCode = TemplateBE.bind({});
export const FrRequestNewTypeCode = TemplateBE.bind({});
export const NewCodeBackEndError = TemplateBE.bind({});
export const ServerErrorReqNewCode = TemplateBE.bind({});
export const UseNewNumber = TemplateBE.bind({});


EngErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification);
EngErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code in English",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verification);
FrErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code in French",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SmsErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.twoStepVerification, errorResponse, 'sms');
SmsErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SmsSuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.twoStepVerification, successResponse, 'sms');
SmsSuccessfulBackEnd.play = async ({ canvasElement, step }) => {

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

VoiceErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.twoStepVerificationVoice, errorResponse, 'voice');
VoiceErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

VoiceSuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.twoStepVerificationVoice, successResponse, 'voice');
VoiceSuccessfulBackEnd.play = async ({ canvasElement, step }) => {

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

ServerErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.twoStepVerification, null, 'sms');
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse, 'sms');
EngRequestNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}

FrRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice, successResponse, 'voice');
FrRequestNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: frPageContentJson[17],
        linkText: frPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}
NewCodeBackEndError.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice, errorResponse, 'voice');
NewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: serverError,
        linkText: engPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}


ServerErrorReqNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice, null, 'voice');
ServerErrorReqNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        linkText: engPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}

EngRequestNewTypeCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice, successResponse, 'sms');
EngRequestNewTypeCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[11],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}
FrRequestNewTypeCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse, 'voice');
FrRequestNewTypeCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: frPageContentJson[17],
        linkText: frPageContentJson[12],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}

UseNewNumber.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse, 'voice');
UseNewNumber.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful use new number",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[13],
        delay: 1000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.redirect
    })
}

