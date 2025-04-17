// import Page from "../../../views/Page";
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
import {ACTION_TYPES, TEST_TYPES, TestDataUserProvider} from "../utils/constants.jsx";
import {storyParametersNew, testCase} from "../utils/functions.jsx";
import HomePage from "../../../views/Home/HomePage.jsx";

const serverError =  "Value is not a valid email address: There must be something after the @-sign.";
const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "OTP sent successfully",
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
    link: NAVIGATION_LINKS.home,
    flow:FLOW_TYPES.signIn
}

export default {

    title: 'GC Sign In/Tests/Sign In/Sign In Page',
    component: HomePage,

    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

const BadTemplateFE = (args) =>   {

    TestDataUserProvider.testData.email = "test@test";

    return(
        <UserProvider initial={TestDataUserProvider}><HomePage  /><button  aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const SuccessfulPassFE = (args) =>   {

    TestDataUserProvider.testData.email = "test@test.com";

    return(
        <UserProvider initial={TestDataUserProvider}><HomePage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngErrorFrontEnd = BadTemplateFE.bind({});
export const FrErrorFrontEnd = BadTemplateFE.bind({});
// export const ErrorBackEnd = TemplateBE.bind({});
// export const SuccessfulBackEnd = TemplateBE.bind({});
// export const ServerErrorBackEnd = TemplateBE.bind({});

EngErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
});
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

FrErrorFrontEnd.parameters = storyParametersNew({
    ...frontEndStoryParameters,
    language:AVAILABLE_LANGUAGES.fr,
});
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
//
ErrorBackEnd.parameters = storyParametersNew({
    ...backEndStoryParameters,
    language:AVAILABLE_LANGUAGES.en,
    response:errorResponse,

});
ErrorBackEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad email For Back End Error",
        link: 'email',
        heading: engErrorPageJson[1],
        message: serverError,
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}
//
// SuccessfulBackEnd.parameters =  storyParametersNew({
//     ...backEndStoryParameters,
//     language:AVAILABLE_LANGUAGES.en,
//     response:successResponse
// });
// SuccessfulBackEnd.play = async ({ canvasElement, step }) => {
//
//     await testCase({
//         canvasElement,
//         step,
//         stepMessage: "Submit form with good email",
//         link: 'email',
//         delay: 1000,
//         actionType: ACTION_TYPES.submit,
//         type: TEST_TYPES.redirect
//     })
// }
//
// ServerErrorBackEnd.parameters =  storyParametersNew({
//     ...backEndStoryParameters,
//     language:AVAILABLE_LANGUAGES.en,
//     response:null
// });
// ServerErrorBackEnd.play = async ({ canvasElement, step }) => {
//
//     await testCase({
//         canvasElement,
//         step,
//         stepMessage:"Submit form with Back End No Response Error",
//         link: 'email',
//         heading: engErrorPageJson[1],
//         message: engErrorPageJson[7],
//         delay: 1000,
//         actionType: ACTION_TYPES.submit,
//         type: TEST_TYPES.error
//     })
// }