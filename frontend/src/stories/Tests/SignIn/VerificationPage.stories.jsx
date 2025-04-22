import {
    AVAILABLE_LANGUAGES, FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, ERROR_RESPONSE, MSW_VERIFICATION, TEST_TYPES} from "../utils/constants.jsx";
import {
    buildTestCase,
    testCase,
    TestTemplate
} from "../utils/functions.tsx";
const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent(AVAILABLE_LANGUAGES.en, PAGES.verification);
const frPageContentJson = getPageContent(AVAILABLE_LANGUAGES.fr, PAGES.verification);


export default {
    title: 'GC Sign In/Tests/Sign In/Verification Page',
    args:{
        page: PAGES.verification,
        phone: '+1 (***) *** - 4567',
        otp: '123456'
    }
};

export const EngErrorFrontEnd = TestTemplate.bind({});
export const FrErrorFrontEnd = TestTemplate.bind({});
export const SmsErrorBackEnd = TestTemplate.bind({});
export const SmsSuccessfulBackEnd = TestTemplate.bind({});
export const VoiceErrorBackEnd = TestTemplate.bind({});
export const VoiceSuccessfulBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const EngRequestNewCode = TestTemplate.bind({});
export const FrRequestNewCode = TestTemplate.bind({});
export const EngRequestNewTypeCode = TestTemplate.bind({});
export const FrRequestNewTypeCode = TestTemplate.bind({});
export const NewCodeBackEndError = TestTemplate.bind({});
export const ServerErrorReqNewCode = TestTemplate.bind({});
export const UseNewNumber = TestTemplate.bind({});

EngErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    null);
EngErrorFrontEnd.args = {otp: "12345e"};
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

FrErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    null);
FrErrorFrontEnd.args = {otp: "12345e"};
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

SmsErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    [MSW_VERIFICATION.signin.sms.error]);
SmsErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SmsSuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    [MSW_VERIFICATION.signin.sms.success]);
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

VoiceErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.voice.error]);
VoiceErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

VoiceSuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.voice.success]);
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

ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.serverTimeOut]);
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

EngRequestNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    [MSW_VERIFICATION.signin.requestNewCode.sms.success]);
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

FrRequestNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.requestNewCode.voice.success]);
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

NewCodeBackEndError.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    [MSW_VERIFICATION.signin.requestNewCode.sms.error]);
NewCodeBackEndError.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Resend code with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        linkText: engPageContentJson[16],
        delay: 11000,
        actionType: ACTION_TYPES.link,
        type: TEST_TYPES.error
    })
}

ServerErrorReqNewCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.requestNewCode.serverTimeOut]);
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

EngRequestNewTypeCode.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
    [MSW_VERIFICATION.signin.requestNewCode.voice.success]);
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
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    [MSW_VERIFICATION.signin.requestNewCode.sms.success]);
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
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
    null);
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

