import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    ERROR_RESPONSE,
    MSW_VERIFICATION,
    TEST_TYPES,
    TEST_USERS
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.tsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

export default {
    title: 'GC Sign In/Tests/Sign Up/Verification Set Up Page',
    args:{
        page: PAGES.verificationSetUp
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.twoStepVerification,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
        null)
};

export const EngNoNumberErrorFrontEnd = TestTemplate.bind({});
export const FrNoNumberErrorFrontEnd = TestTemplate.bind({});
export const EngDigitErrorFrontEnd = TestTemplate.bind({});
export const FrDigitErrorFrontEnd = TestTemplate.bind({});
export const ErrorBackEnd = TestTemplate.bind({});
export const ServerErrorBackEnd = TestTemplate.bind({});
export const SuccessfulBackEnd = TestTemplate.bind({});
export const TestUser = TestTemplate.bind({});



EngNoNumberErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no Phone number in English",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[10],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

const frenchParameters =  buildTestCase.parameters(NAVIGATION_LINKS.twoStepVerification,
    { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp },
    null);
FrNoNumberErrorFrontEnd.parameters = frenchParameters;
FrNoNumberErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no Phone number in French",
        link: 'phone',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[10],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngDigitErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in English",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[8]+'11'+engErrorPageJson[9],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number without enough digits.', value: '416123'}
    })
}

FrDigitErrorFrontEnd.parameters = frenchParameters;
FrDigitErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in French",
        link: 'phone',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[8]+'11'+frErrorPageJson[9],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number without enough digits.', value: '416123'}
    })
 }

ErrorBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.twoStepVerification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.verificationSetUp.error]);
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Phone number in English for back end error test",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: ERROR_RESPONSE.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}
ServerErrorBackEnd.parameters =buildTestCase.parameters(NAVIGATION_LINKS.twoStepVerification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.verificationSetUp.serverTimeOut]);
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Back End No Response Error",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}

SuccessfulBackEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.twoStepVerification,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    [MSW_VERIFICATION.signup.verificationSetUp.success]);
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good phone number",
        link: 'phone',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}

TestUser.args ={email:  TEST_USERS.keys().next().value };
TestUser.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with test user",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}