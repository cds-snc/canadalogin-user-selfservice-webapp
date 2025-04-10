import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../utils/constants.jsx";
import {storyParameters, testCase} from "../utils/functions.jsx";
import PasswordPage from "../../../views/Password/PasswordPage.jsx";


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

TestDataUserProvider.userData.password = "123456789012";

export default {

    title: 'GC Sign In/Tests/Sign Up/Password Creation Page',
    component: PasswordPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};


const BadTemplateFE = (args) =>   {

    TestDataUserProvider.testData.password = "1234567890";

    return(
        <UserProvider initial={TestDataUserProvider}><PasswordPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const TemplateBE = (args) =>   {

    TestDataUserProvider.testData.password = "123456789012";

    return(
        <UserProvider initial={TestDataUserProvider}><PasswordPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}


export const EngErrorFrontEnd = BadTemplateFE.bind({});
export const FrErrorFrontEnd = BadTemplateFE.bind({});
export const ErrorBackEnd = TemplateBE.bind({});
export const SuccessfulBackEnd = TemplateBE.bind({});
export const ServerErrorBackEnd = TemplateBE.bind({});


EngErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.password);
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

FrErrorFrontEnd.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.password);
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

ErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.password, SUBMIT_END_POINTS.create, errorResponse);
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with bad password For Back End Error",
        link: 'password',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.password, SUBMIT_END_POINTS.create, successResponse);
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

ServerErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.password, SUBMIT_END_POINTS.create, null);
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

