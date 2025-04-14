import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS,} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../utils/constants.jsx";
import {storyParameters, testCase} from "../utils/functions.jsx";
import CreateCoreProfilePage from "../../../views/SignUp/CreateCoreProfilePage.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

const serverError =  "The system cannot process the request because the name is not valid.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "Profile sent successfully",
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

    title: 'GC Sign In/Tests/Sign Up/Create Core Profile Page',
    component: CreateCoreProfilePage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

const BadTC1TemplateBE = (args) =>   {
    TestDataUserProvider.testData.firstName = "Test";
    TestDataUserProvider.testData.lastName = "";
    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const BadTC2TemplateBE = (args) =>   {
    TestDataUserProvider.testData.firstName = "";
    TestDataUserProvider.testData.lastName = "M";

    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}
const BadTC3TemplateBE = (args) =>   {
    TestDataUserProvider.testData.firstName = "";
    TestDataUserProvider.testData.lastName = "Test!";

    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}
const BadTC4TemplateBE = (args) =>   {
    TestDataUserProvider.testData.lastName = "Test";
    TestDataUserProvider.testData.firstName = "Test@";
    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const TemplateBE = (args) =>   {
    TestDataUserProvider.testData.lastName = "Test";
    TestDataUserProvider.testData.firstName = "Test";
    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const FrTemplateBE = (args) =>   {
    TestDataUserProvider.testData.lastName = "Test";
    TestDataUserProvider.testData.firstName = "Ç'âêîôû-àèù ëïü";
    return(
        <UserProvider initial={TestDataUserProvider}><CreateCoreProfilePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngNoLastName = BadTC1TemplateBE.bind({});
export const EngLastNameOneChar = BadTC2TemplateBE.bind({});
export const EngLastNameBadChar = BadTC3TemplateBE.bind({});
export const EngFirstNameBadChar = BadTC4TemplateBE.bind({});
export const FrNoLastName = BadTC1TemplateBE.bind({});
export const FrLastNameOneChar = BadTC2TemplateBE.bind({});
export const FrLastNameBadChar = BadTC3TemplateBE.bind({});
export const FrFirstNameBadChar = BadTC4TemplateBE.bind({});
export const ErrorBackEnd = TemplateBE.bind({});
export const ServerErrorBackEnd = TemplateBE.bind({});
export const SuccessfulBackEnd = TemplateBE.bind({});
export const SuccessfulWithFrCharsBackEnd = FrTemplateBE.bind({});

EngNoLastName.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngNoLastName.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no last name in English",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngLastNameOneChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngLastNameOneChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with one char in last name in English",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngLastNameBadChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngLastNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in last name in English",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngFirstNameBadChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngFirstNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in first name in English",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}



FrNoLastName.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrNoLastName.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no last name in English",
        link: 'lastName',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrLastNameOneChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrLastNameOneChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with one char in last name in English",
        link: 'lastName',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrLastNameBadChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrLastNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in last name in English",
        link: 'lastName',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrFirstNameBadChar.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrFirstNameBadChar.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad char in first name in English",
        link: 'lastName',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[11],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.coreProfile, SUBMIT_END_POINTS.createCoreProfile, errorResponse);
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad name in English",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

ServerErrorBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.coreProfile, SUBMIT_END_POINTS.createCoreProfile, null);
ServerErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with Back End No Response Error",
        link: 'lastName',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[7],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.coreProfile, SUBMIT_END_POINTS.createCoreProfile, successResponse);
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

SuccessfulWithFrCharsBackEnd.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.coreProfile, SUBMIT_END_POINTS.createCoreProfile, successResponse);
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

