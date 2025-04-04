import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS,} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../constants.jsx";
import {storyParameters, testCase} from "../functions.jsx";
import VerificationSetUpPage from "../../../views/SignUp/VerificationSetUpPage.jsx";

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
    component: VerificationSetUpPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};


const BadEmailTemplateFE = (args) =>   {
    return(
        <UserProvider initial={TestDataUserProvider}><VerificationSetUpPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const EmailTemplateBE = (args) =>   {
    return(
        <UserProvider initial={TestDataUserProvider}><VerificationSetUpPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}
export const EngNoNumberErrorFrontEndTest = BadEmailTemplateFE.bind({});
export const FrNoNumberErrorFrontEndTest = BadEmailTemplateFE.bind({});
export const EngDigitErrorFrontEndTest = BadEmailTemplateFE.bind({});
export const FrDigitErrorFrontEndTest = BadEmailTemplateFE.bind({});
export const ErrorBackEnd = EmailTemplateBE.bind({});
export const ServerErrorBackEnd = EmailTemplateBE.bind({});
export const SuccessfulBackEnd = EmailTemplateBE.bind({});

EngNoNumberErrorFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngNoNumberErrorFrontEndTest.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in English",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[10],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrNoNumberErrorFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrNoNumberErrorFrontEndTest.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in English",
        link: 'phone',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[10],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngDigitErrorFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngDigitErrorFrontEndTest.play = async ({ canvasElement, step }) => {

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

FrDigitErrorFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrDigitErrorFrontEndTest.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in English",
        link: 'phone',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[8]+'11'+frErrorPageJson[9],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number without enough digits.', value: '416123'}
    })
 }

ErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, errorResponse);
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad Phone number in English",
        link: 'phone',
        heading: engErrorPageJson[1],
        message: errorResponse.message,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}
ServerErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.signUp, SUBMIT_END_POINTS.sendTwoStepVerificationCode, null);
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

SuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.signUp, SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse);
SuccessfulBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good email",
        link: 'phone',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect,
        input: {inputType: 'textBox', stepMessage:'Enter phone Number with enough digits.', value: '4161234567'}
    })
}