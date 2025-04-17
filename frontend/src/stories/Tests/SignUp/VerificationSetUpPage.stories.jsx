import {withRouter} from 'storybook-addon-remix-react-router';
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS,
} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../utils/constants.jsx";
import {storyParametersNew, testCase} from "../utils/functions.tsx";
import Page from "../../../views/Page.js";


const frontEndStoryParameters = {
    isBackEndTest:false,
    link:NAVIGATION_LINKS.twoStepVerification,
    flow:FLOW_TYPES.signUp
}

const backEndStoryParameters = {
    isBackEndTest:true,
    link:NAVIGATION_LINKS.twoStepVerification,
    flow:FLOW_TYPES.signUp,
    endpoint:SUBMIT_END_POINTS.sendTwoStepVerificationCode
}

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

const serverError =  "The system cannot process the request because the phone number is not valid.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "Phone number sent successfully",
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

export default {

    title: 'GC Sign In/Tests/Sign Up/Verification Set Up Page',
    component: Page,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

const Template = (args) =>   {
    return(
        <UserProvider initial={TestDataUserProvider}><Page page={PAGES.verificationSetUp} /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}
export const EngNoNumberErrorFrontEnd = Template.bind({});
export const FrNoNumberErrorFrontEnd = Template.bind({});
export const EngDigitErrorFrontEnd = Template.bind({});
export const FrDigitErrorFrontEnd = Template.bind({});
export const ErrorBackEnd = Template.bind({});
export const ServerErrorBackEnd = Template.bind({});
export const SuccessfulBackEnd = Template.bind({});

EngNoNumberErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en
});
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

FrNoNumberErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.fr
});
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

EngDigitErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en
});
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

FrDigitErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.fr
});
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

ErrorBackEnd.parameters = storyParametersNew({
    ...backEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse
});
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Phone number in English for back end error test",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: errorResponse.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}
ServerErrorBackEnd.parameters =storyParametersNew({
    ...backEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:null
});
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

SuccessfulBackEnd.parameters = storyParametersNew({
    ...backEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:successResponse
});
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