import {withRouter} from 'storybook-addon-remix-react-router';
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    ERROR_RESPONSE,
    MSW_PASSWORD_POLICY,
    MSW_VERIFICATION,
    TEST_TYPES,
    TestDataUserProvider
} from "../utils/constants.jsx";
import {buildTestCase, storyParametersNew, Template, testCase, TestTemplate} from "../utils/functions.tsx";
import Page from "../../../views/Page.js";


const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");


const serverError =  "The system cannot process the request because the password was not found.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "Password sent successfully",
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
    link:NAVIGATION_LINKS.password,
    flow:FLOW_TYPES.signUp
}

const backEndStoryParameters = {
    ...frontEndStoryParameters,
    isBackEndTest:true,
    endpoint:SUBMIT_END_POINTS.create
}

export default {
    title: 'GC Sign In/Tests/Sign Up/Password Creation Page',
    args:{
        page: PAGES.password,
        password: "1234567890"
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.password,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
        [MSW_PASSWORD_POLICY])
};

export const EngErrorFrontEnd = TestTemplate.bind({});
export const FrErrorFrontEnd = TestTemplate.bind({});
export const ErrorBackEnd = TestTemplate.bind({});
export const SuccessfulBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});

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
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp },
    [MSW_PASSWORD_POLICY]);
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

ErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_PASSWORD_POLICY, MSW_VERIFICATION.signup.password.error]);
ErrorBackEnd.args = {password:"123456789012"};
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad password For Back End Error",
        link: 'password',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_PASSWORD_POLICY, MSW_VERIFICATION.signup.password.success]);
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

ServerErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.coreProfile,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_PASSWORD_POLICY, MSW_VERIFICATION.signup.password.serverTimeOut]);
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

