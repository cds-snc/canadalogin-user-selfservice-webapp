import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {TestDataUserProvider} from "../constants.jsx";
import {errorSummaryTest, storyParameters, successSummaryTest} from "../functions.jsx";
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

    TestDataUserProvider.testData.phone = "1416123";
    return(
        <UserProvider initial={TestDataUserProvider}><VerificationSetUpPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const EmailTemplateBE = (args) =>   {

    TestDataUserProvider.testData.phone = "141612345678";

    return(
        <UserProvider initial={TestDataUserProvider}><VerificationSetUpPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngBadFrontEndTest = BadEmailTemplateFE.bind({});
export const FrBadFrontEndTest = BadEmailTemplateFE.bind({});
//export const BadBackEndTest = EmailTemplateBE.bind({});
// export const SuccessfulBackEndTest = EmailTemplateBE.bind({});
// //export const ServerErrorBackEndTest = EmailTemplateBE.bind({});ServerErrorBackEndTest

EngBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification);
EngBadFrontEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with  Phone number in English",
        link: 'phone',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[10]
    })
}

FrBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.twoStepVerification);
FrBadFrontEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad Phone number in French",
        link: 'phone',
        heading: frErrorPageJson[1],
        error: frErrorPageJson[10]
    })
 }
//
// BadBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, errorResponse);
//
// BadBackEndTest.play = async ({ canvasElement, step }) => {
//
//     await errorSummaryTest({
//         canvasElement,
//         step,
//         message: "Submit form with bad Phone number For Back End Error",
//         link: 'verificationCode',
//         heading: engErrorPageJson[1],
//         error: engErrorPageJson[7]
//     })
//
// }

// SuccessfulBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.twoStepVerification, SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse);
//
// SuccessfulBackEndTest.play = async ({ canvasElement, step }) => {
//
//     await successSummaryTest({
//         canvasElement,
//         step,
//         message: "Submit form with good code",
//         link: 'verificationCode'
//     })
//
// }





