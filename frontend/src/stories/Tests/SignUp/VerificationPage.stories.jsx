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
    flow:FLOW_TYPES.signUp
}
const smsFrontEndStoryParameters = {
    ...frontEndStoryParameters,
    type:FLOW_TYPES.sms
}
const voiceFrontEndStoryParameters = {
    ...frontEndStoryParameters,
    type:FLOW_TYPES.voice
}
const emailFrontEndStoryParameters = {
    ...frontEndStoryParameters,
    type:FLOW_TYPES.email
}
const backEndStoryParameters = {
    isBackEndTest:true,
    link:NAVIGATION_LINKS.verification,
    flow:FLOW_TYPES.signUp
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
const emailStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.otpVerify,
    type:FLOW_TYPES.email,
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
const emailNewCodeStoryParameters = {
    ...backEndStoryParameters,
    endpoint:SUBMIT_END_POINTS.sendOtpCode,
    type:FLOW_TYPES.email,
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
    flow:FLOW_TYPES.signUp,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCode,
    type:FLOW_TYPES.voice,
}
const useNewEmailStoryParameters = {
    isBackEndTest:true,
    link:NAVIGATION_LINKS.signUp,
    flow:FLOW_TYPES.signUp,
    endpoint:SUBMIT_END_POINTS.sendOtpCode,
    type:FLOW_TYPES.email,
}
export default {

    title: 'GC Sign In/Tests/Sign Up/Verification Page',
    component: Page,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

TestDataUserProvider.userData.phone = '+1 (416) 123 - 4567';

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

export const EngEmailErrorFrontEnd = BadTemplateFE.bind({});
export const EngSmsErrorFrontEnd = BadTemplateFE.bind({});
export const FrVoiceErrorFrontEnd = BadTemplateFE.bind({});
export const EmailErrorBackEnd = TemplateBE.bind({});
export const EmailSuccessfulBackEnd = TemplateBE.bind({});
export const SmsErrorBackEnd = TemplateBE.bind({});
export const SmsSuccessfulBackEnd = TemplateBE.bind({});
export const VoiceErrorBackEnd = TemplateBE.bind({});
export const VoiceSuccessfulBackEnd = TemplateBE.bind({});
export const ServerErrorBackEnd = TemplateBE.bind({});
export const EngEmailRequestNewCode = TemplateBE.bind({});
export const EngSmsRequestNewCode = TemplateBE.bind({});
export const FrVoiceRequestNewCode = TemplateBE.bind({});
export const EngRequestNewTypeCode = TemplateBE.bind({});
export const FrRequestNewTypeCode = TemplateBE.bind({});
export const EmailNewCodeBackEndError = TemplateBE.bind({});
export const VoiceNewCodeBackEndError = TemplateBE.bind({});
export const ServerErrorReqNewCode = TemplateBE.bind({});
export const UseNewNumber = TemplateBE.bind({});
export const UseNewEmail = TemplateBE.bind({});

EngEmailErrorFrontEnd.parameters = storyParametersNew({
    ...emailFrontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en
});
EngEmailErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code in English for Email",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}


EngSmsErrorFrontEnd.parameters = storyParametersNew({
    ...smsFrontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en
});
EngSmsErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code in English for SMS",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrVoiceErrorFrontEnd.parameters = storyParametersNew({
    ...voiceFrontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
});
FrVoiceErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code in French for Voice",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[3],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EmailErrorBackEnd.parameters = storyParametersNew({
    ...emailStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,
});
EmailErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code for email Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EmailSuccessfulBackEnd.parameters = storyParametersNew({
    ...emailStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
EmailSuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good code for Email",
        link: 'verificationCode',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
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
        stepMessage:"Submit form with bad code for SMS Back End Error",
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
        stepMessage: "Submit form with good code for SMS",
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
        stepMessage:"Submit form with bad code for Voice Back End Error",
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
        stepMessage: "Submit form with good code for Voice",
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


EngEmailRequestNewCode.parameters = storyParametersNew({
    ...emailNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
EngEmailRequestNewCode.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[26],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.success
    })
}

EngSmsRequestNewCode.parameters = storyParametersNew({
    ...smsNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
EngSmsRequestNewCode.play = async ({ canvasElement, step }) => {

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

FrVoiceRequestNewCode.parameters = storyParametersNew({
    ...voiceNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
    response:successResponse,
});
FrVoiceRequestNewCode.play = async ({ canvasElement, step }) => {

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
EmailNewCodeBackEndError.parameters = storyParametersNew({
    ...emailNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,
});
EmailNewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End for Email No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: serverError,
        linkText: engPageContentJson[26],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}
VoiceNewCodeBackEndError.parameters = storyParametersNew({
    ...voiceNewCodeStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
    response:errorResponse,
});
VoiceNewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End for Voice Fr No Response Error",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        message: serverError,
        linkText: frPageContentJson[16],
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
        linkText: engPageContentJson[13],
        delay: 1000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.redirect
    })
}

UseNewEmail.parameters = storyParametersNew({
    ...useNewEmailStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse,
});
UseNewEmail.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful use a different email",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[25],
        delay: 1000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.redirect
    })
}

