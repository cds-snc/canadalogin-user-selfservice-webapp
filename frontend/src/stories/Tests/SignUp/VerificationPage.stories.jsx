import {
    AVAILABLE_LANGUAGES, FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES, ERROR_RESPONSE,
    MSW_MOCKS,
    TEST_TYPES, TEST_USERS
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";
const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent('en',  PAGES.verification);
const frPageContentJson = getPageContent('fr', PAGES.verification);

export default {
    title: 'GC Sign In/Tests/Sign Up/Verification Page',
    args:{
        page: PAGES.verification,
        phone: '+1 (123) 456 - 7890',
        email: 'test@test.com',
        otp: '12345e'
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.verification,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email },
        null)
};

export const EngEmailErrorFrontEnd = TestTemplate.bind({});
export const EngSmsErrorFrontEnd = TestTemplate.bind({});
export const FrVoiceErrorFrontEnd = TestTemplate.bind({});
export const EmailErrorBackEnd = TestTemplate.bind({});
export const EmailSuccessfulBackEnd = TestTemplate.bind({});
export const SmsErrorBackEnd = TestTemplate.bind({});
export const SmsSuccessfulBackEnd = TestTemplate.bind({});
export const VoiceErrorBackEnd = TestTemplate.bind({});
export const VoiceSuccessfulBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const EngEmailRequestNewCode = TestTemplate.bind({});
export const EngSmsRequestNewCode = TestTemplate.bind({});
export const FrVoiceRequestNewCode = TestTemplate.bind({});
export const EngRequestNewTypeCode = TestTemplate.bind({});
export const FrRequestNewTypeCode = TestTemplate.bind({});
export const EmailNewCodeBackEndError = TestTemplate.bind({});
export const VoiceNewCodeBackEndError = TestTemplate.bind({});
export const ServerErrorReqNewCode = TestTemplate.bind({});
export const UseNewNumber = TestTemplate.bind({});
export const UseNewEmail = TestTemplate.bind({});
export const TestUserBadCode = TestTemplate.bind({});
export const TestUserEmail = TestTemplate.bind({});
export const TestUserSms = TestTemplate.bind({});
export const TestUserVoice = TestTemplate.bind({});
export const TestUserRequestVoiceCode = TestTemplate.bind({});

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

EngSmsErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    null);
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

FrVoiceErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    null);
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

EmailErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email },
    [MSW_MOCKS.transientOtpVerify.error]);
EmailErrorBackEnd.args = {otp: '123456'}
EmailErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code for email Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EmailSuccessfulBackEnd.parameters =  buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email },
    [MSW_MOCKS.transientOtpVerify.emailSuccess]);
EmailSuccessfulBackEnd.args = {otp: '123456'}
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

SmsErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    [MSW_MOCKS.transientOtpVerify.error]);
SmsErrorBackEnd.args = {otp: '123456'}
SmsErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code for SMS Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SmsSuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    [MSW_MOCKS.transientOtpVerify.smsSuccess]);
SmsSuccessfulBackEnd.args = {otp: '123456'}
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

VoiceErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpVerify.error]);
VoiceErrorBackEnd.args = {otp: '123456'}
VoiceErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code for Voice Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

VoiceSuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpVerify.voiceSuccess]);
VoiceSuccessfulBackEnd.args = {otp: '123456'}
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

ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpVerify.serverTimeOut]);
ServerErrorBackEnd.args = {otp: '123456'}
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


EngEmailRequestNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email },
    [MSW_MOCKS.transientOtpSend.emailSuccess]);
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

EngSmsRequestNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    [MSW_MOCKS.transientOtpSend.smsSuccess]);
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

FrVoiceRequestNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpSend.voiceSuccess]);
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
EmailNewCodeBackEndError.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email },
    [MSW_MOCKS.transientOtpSend.error]);
EmailNewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End for Email No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        linkText: engPageContentJson[26],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}
VoiceNewCodeBackEndError.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpSend.error]);
VoiceNewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End for Voice Fr No Response Error",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        linkText: frPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}


ServerErrorReqNewCode.parameters =  buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpSend.serverTimeOut]);
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

EngRequestNewTypeCode.parameters =  buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    [MSW_MOCKS.transientOtpSend.voiceSuccess]);
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
FrRequestNewTypeCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    [MSW_MOCKS.transientOtpSend.smsSuccess]);
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

UseNewNumber.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    null);
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
const testUserEmail =  TEST_USERS.keys().next().value;

TestUserBadCode.args ={email: testUserEmail, otp: '123456'};
TestUserBadCode.play = async ({ canvasElement, step }) => {
    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code, test user",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

const testUserOtps =  TEST_USERS.get(testUserEmail);

TestUserEmail.args ={email: testUserEmail, otp: testUserOtps.emailOtp};
TestUserEmail.play = async ({ canvasElement, step }) => {
    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user email",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

TestUserSms.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    null);
TestUserSms.args ={email: testUserEmail, otp: testUserOtps.smsOtp};
TestUserSms.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user sms",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

TestUserVoice.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice },
    null);
TestUserVoice.args ={email: testUserEmail, otp: testUserOtps.voiceOtp};
TestUserVoice.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user voice",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

TestUserRequestVoiceCode.parameters =  buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms },
    null);
TestUserRequestVoiceCode.args ={email: testUserEmail}
TestUserRequestVoiceCode.play = async ({ canvasElement, step }) => {

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


