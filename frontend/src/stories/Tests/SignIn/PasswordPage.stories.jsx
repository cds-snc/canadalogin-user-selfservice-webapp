import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    MSW_MOCKS, PASSWORD_ERROR_RESPONSE,
    TEST_TYPES, TEST_USERS
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";

const engErrorPageJson = getPageContent(AVAILABLE_LANGUAGES.en, PAGES.error);
const frErrorPageJson = getPageContent(AVAILABLE_LANGUAGES.fr, PAGES.error);

export default {
    title: 'GC Sign In/Tests/Sign In/Password Page',
    args:{
        page: PAGES.password,
        password: "1234567890"
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.password,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
        [MSW_MOCKS.passwordPolicy])
};

export const EngErrorFrontEnd = TestTemplate.bind({});
export const FrErrorFrontEnd = TestTemplate.bind({});
export const ErrorBackEnd = TestTemplate.bind({});
export const SuccessfulBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const TestUser = TestTemplate.bind({});

EngErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad password in English",
        link: 'password',
        heading: engErrorPageJson[1],
        message: `${engErrorPageJson[5]} 12 ${engErrorPageJson[12]} 65 ${engErrorPageJson[13]}`,
        delay: 3000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn },
    [MSW_MOCKS.passwordPolicy]);
FrErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad password in French",
        link: 'password',
        heading: frErrorPageJson[1],
        message: `${frErrorPageJson[5]} 12 ${frErrorPageJson[12]} 65 ${frErrorPageJson[13]}`,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    [MSW_MOCKS.passwordPolicy, MSW_MOCKS.login.success]);
SuccessfulBackEnd.args = {password:"123456789012"};
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good password For Back End Success",
        link: 'password',
        delay: 3000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

ErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    [MSW_MOCKS.passwordPolicy, MSW_MOCKS.login.error]);
ErrorBackEnd.args = {password:"123456789012"};
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad password For Back End Error",
        link: 'password',
        heading: engErrorPageJson[1],
        message: PASSWORD_ERROR_RESPONSE.data.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn },
    [MSW_MOCKS.passwordPolicy, MSW_MOCKS.login.serverTimeOut]);
ServerErrorBackEnd.args = {password:"123456789012"};
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with Back End No Response Error",
        link: 'password',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

TestUser.args = {email: TEST_USERS.keys().next().value, password:"testUser12345"};
TestUser.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user",
        link: 'password',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

