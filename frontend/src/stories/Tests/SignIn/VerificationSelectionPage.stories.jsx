
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.js";
import {ACTION_TYPES, MSW_MOCKS, TEST_TYPES, TEST_USERS} from "../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
const engErrorPageJson = getPageContent(AVAILABLE_LANGUAGES.en, PAGES.error);

export default {
    title: 'GC Sign In/Tests/Sign In/Verification Selection Page',
    args:{
        page:PAGES.verificationSelection,
        phone: '+1(***) ***-1234',
        otpType: 'sms'
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
        [MSW_MOCKS.otpSend.smsSuccess])
};



export const SuccessfulBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const TestUserSms = TestTemplate.bind({});
export const TestUserVoice = TestTemplate.bind({});

SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Successful submit sending code to default.",
        link: '',
        delay: 3000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}


ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    [MSW_MOCKS.otpSend.serverTimeOut]);
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with Back End No Response Error",
        link: 'number',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

TestUserSms.args = {email: TEST_USERS.keys().next().value, passwordValidated:true, phone: '+1(***) ***-1234', id:'12345-12346', otpType:'sms'};
TestUserSms.parameters= buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    []);
TestUserSms.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user for SMS",
        link: 'password',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

TestUserVoice.args = {email: TEST_USERS.keys().next().value, passwordValidated:true, phone: '+1(***) ***-1234', id:'12345-12346', otpType:'voice'};
TestUserVoice.parameters= buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    []);
TestUserVoice.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user for Voice",
        link: 'password',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}