import {withRouter} from 'storybook-addon-remix-react-router';
import {
    AVAILABLE_LANGUAGES, FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../utils/constants.jsx";
import {storyParametersNew, testCase} from "../utils/functions.jsx";
import Page from "../../../views/Page.tsx";
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
const frontEndStoryParameters = {
    isBackEndTest:false,
    link:NAVIGATION_LINKS.verification,
    flow:FLOW_TYPES.signIn
}

const backEndStoryParameters = {
    isBackEndTest:true,
    link:NAVIGATION_LINKS.verification,
    flow:FLOW_TYPES.signIn
}
const smsStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.otpVerify,
    type:FLOW_TYPES.sms,
}
const voiceStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.otpVerify,
    type:FLOW_TYPES.voice,
}
const smsNewCodeStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCode,
    type:FLOW_TYPES.sms,
}
const voiceNewCodeStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
    type:FLOW_TYPES.voice,
}
const smsNewTypeCodeStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice,
    type:FLOW_TYPES.sms,
}
const voiceNewTypeCodeStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCode,
    type:FLOW_TYPES.voice,
}
const useNewNumberStoryParameters = {
    isBackEndTest:true,
    link:NAVIGATION_LINKS.twoStepVerification,
    flow:FLOW_TYPES.signIn,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCode,
    type:FLOW_TYPES.voice,
}
export default {

    title: 'GC Sign In/Tests/Sign In/Verification Page',
    component: Page,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

TestDataUserProvider.userData.phone = '+1 (***) *** - 4567';

const BadTemplateFE = (args) =>   {

    TestDataUserProvider.testData.otp = "12154e";
    return(
        <UserProvider initial={TestDataUserProvider}><Page page={PAGES.verification} /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const TemplateBE = (args) =>   {

    TestDataUserProvider.testData.otp = "123456";

    return(
        <UserProvider initial={TestDataUserProvider}><Page page={PAGES.verification} /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
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


EngErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en
});
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

FrErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
});
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

SmsErrorBackEnd.parameters = storyParametersNew({
    ...smsStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,
});
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

SmsSuccessfulBackEnd.parameters = storyParametersNew({
    ...smsStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
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

VoiceErrorBackEnd.parameters = storyParametersNew({
    ...voiceStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,
});
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

VoiceSuccessfulBackEnd.parameters = storyParametersNew({
    ...voiceStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
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

ServerErrorBackEnd.parameters = storyParametersNew({
    ...voiceStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:null,
});
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

EngRequestNewCode.parameters = storyParametersNew({
    ...smsNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
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

FrRequestNewCode.parameters = storyParametersNew({
    ...voiceNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
    response:successResponse,
});
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
NewCodeBackEndError.parameters = storyParametersNew({
    ...voiceNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,
});
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


ServerErrorReqNewCode.parameters = storyParametersNew({
    ...voiceNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:null,
});
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

EngRequestNewTypeCode.parameters = storyParametersNew({
    ...smsNewTypeCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
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
FrRequestNewTypeCode.parameters = storyParametersNew({
    ...voiceNewTypeCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
    response:successResponse,
});
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

UseNewNumber.parameters = storyParametersNew({
    ...useNewNumberStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
UseNewNumber.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful use new number",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[21],
        delay: 1000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.redirect
    })
}

