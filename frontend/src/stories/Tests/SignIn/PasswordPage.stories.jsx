import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    MSW_MOCKS,
    TEST_TYPES, TEST_USERS
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

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
SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
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

TestUser.args = {email: TEST_USERS.keys().next().value, password:"123456789012"};
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

