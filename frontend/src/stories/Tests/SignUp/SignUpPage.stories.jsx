import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES, ERROR_RESPONSE,
    MSW_VERIFICATION,
    TEST_TYPES
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";
const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

export default {
    title: 'GC Sign In/Tests/Sign Up/Sign Up Page',
    args:{
        page: PAGES.signup,
        email: "test@test"
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.signUp,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
        null)
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
        stepMessage:"Submit form with bad email in English",
        link: 'email',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[2],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.signUp,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp },
    null);
FrErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad email in French",
        link: 'email',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[2],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.signUp,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.signUp.error]);
ErrorBackEnd.args ={email: "test@test.com"};
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad email For Back End Error",
        link: 'email',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.signUp,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.signUp.success]);
SuccessfulBackEnd.args ={email: "test@test.com"};
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good email",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.signUp,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.signUp.serverTimeOut]);
ServerErrorBackEnd.args ={email: "test@test.com"};
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Back End No Response Error",
        link: 'email',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}


TestUser.args ={email: "test@test.gc.ca"};
TestUser.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}