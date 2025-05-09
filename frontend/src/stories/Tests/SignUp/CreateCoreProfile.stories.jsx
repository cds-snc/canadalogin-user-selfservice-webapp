import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    MSW_MOCKS,
    PROFILE_ERROR_RESPONSE,
    TEST_TYPES,
    TEST_USERS,
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";
import {EngErrorFrontEnd} from "../SignIn/VerificationPage.stories.jsx";

const engErrorPageJson = getPageContent(AVAILABLE_LANGUAGES.en, PAGES.error);
const frErrorPageJson = getPageContent(AVAILABLE_LANGUAGES.fr, PAGES.error);

export default {
    title: 'GC Sign In/Tests/Sign Up/Create Core Profile Page',
    args:{
        page: PAGES.coreProfile,
        firstName:"",
        lastName:""
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
        null)
};

export const EngNoLastName = TestTemplate.bind({});
export const EngLastNameOneChar = TestTemplate.bind({});
export const EngLastNameBadChar = TestTemplate.bind({});
export const EngFirstNameBadChar = TestTemplate.bind({});
export const FrNoLastName = TestTemplate.bind({});
export const FrLastNameOneChar = TestTemplate.bind({});
export const FrLastNameBadChar = TestTemplate.bind({});
export const FrFirstNameBadChar = TestTemplate.bind({});
export const ErrorBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const SuccessfulBackEnd = TestTemplate.bind({});
export const SuccessfulWithFrCharsBackEnd = TestTemplate.bind({});
export const TestUser = TestTemplate.bind({});

TestUser.args ={lastName: 'Test', email: TEST_USERS.keys().next().value};
TestUser.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user",
        link: 'profile',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}
EngErrorFrontEnd.args = {firstName: "Test"};
EngNoLastName.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no last name in English",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngLastNameOneChar.args = {lastName: "G"};
EngLastNameOneChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with one char in last name in English",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngLastNameBadChar.args = {lastName: "Test!"};
EngLastNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in last name in English",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}


EngFirstNameBadChar.args = {firstName:"Test@" , lastName: "Test"};
EngFirstNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in first name in English",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

const frenchParameters =  buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp },
    null);

FrNoLastName.parameters = frenchParameters;
FrNoLastName.args = {firstName: "Test"};
FrNoLastName.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no last name in English",
        link: 'profile',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrLastNameOneChar.parameters = frenchParameters;
FrLastNameOneChar.args = {lastName: "G"};
FrLastNameOneChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with one char in last name in English",
        link: 'profile',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrLastNameBadChar.parameters = frenchParameters;
FrLastNameBadChar.args = {lastName: "Test!"};
FrLastNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in last name in English",
        link: 'profile',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrFirstNameBadChar.parameters = frenchParameters;
FrFirstNameBadChar.args = {firstName:"Test@" , lastName: "Test"};
FrFirstNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in first name in English",
        link: 'profile',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_MOCKS.createCoreProfile.error]);
ErrorBackEnd.args = {firstName:"Test" , lastName: "Test"};
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad name in English",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: PROFILE_ERROR_RESPONSE.data.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}


ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_MOCKS.createCoreProfile.serverTimeOut]);
ServerErrorBackEnd.args = {firstName:"Test" , lastName: "Test"};
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Back End No Response Error",
        link: 'profile',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_MOCKS.createCoreProfile.success]);
SuccessfulBackEnd.args = {firstName:"Test" , lastName: "Test"};
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good last name",
        link: 'LastName',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

SuccessfulWithFrCharsBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp },
    [MSW_MOCKS.createCoreProfile.success]);
SuccessfulWithFrCharsBackEnd.args = {firstName:"Test" , lastName: "Ç'âêîôû-àèù ëïü"};
SuccessfulWithFrCharsBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good last name with French chars",
        link: 'LastName',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}

