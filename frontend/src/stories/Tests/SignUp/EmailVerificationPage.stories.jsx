import {withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {TestDataUserProvider} from "../constants.jsx";
import EmailVerificationPage from "../../../views/SignUp/EmailVerificationPage.jsx";
import {errorSummaryTest, storyParameters, successLinkTest, successSummaryTest} from "../functions.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent('en', "EmailVerification");
const frPageContentJson = getPageContent('fr', "EmailVerification");

const serverError =  "The system cannot process the request because the verification code was not found.";
const errorResponse = {
    "success": false,
    "message": serverError,
    "data": null
};

const successResponse = {
    "success": true,
    "message": "Verification code sent successfully",
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

TestDataUserProvider.userData.email = "test@test.com";

export default {

    title: 'GC Sign In/Tests/Sign Up/Email Verification Page',
    component: EmailVerificationPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};


const BadEmailTemplateFE = (args) =>   {

    TestDataUserProvider.testData.otp = "12154e";

    return(
        <UserProvider initial={TestDataUserProvider}><EmailVerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const EmailTemplateBE = (args) =>   {

    TestDataUserProvider.testData.otp = "123456";

    return(
        <UserProvider initial={TestDataUserProvider}><EmailVerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngBadFrontEndTest = BadEmailTemplateFE.bind({});
export const FrBadFrontEndTest = BadEmailTemplateFE.bind({});
export const BadBackEndTest = EmailTemplateBE.bind({});
export const SuccessfulBackEndTest = EmailTemplateBE.bind({});
export const ServerErrorBackEndTest = EmailTemplateBE.bind({});
export const EngRequestNewCode = EmailTemplateBE.bind({});
export const FrRequestNewCode = EmailTemplateBE.bind({});

EngBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail);
EngBadFrontEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad code in English",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[3]
    })
}

FrBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail);
FrBadFrontEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad code in French",
        link: 'verificationCode',
        heading: frErrorPageJson[1],
        error: frErrorPageJson[3]
    })
}

BadBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification, errorResponse);
BadBackEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[7]
    })

}

SuccessfulBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification, successResponse);
SuccessfulBackEndTest.play = async ({ canvasElement, step }) => {

    await successSummaryTest({
        canvasElement,
        step,
        message: "Submit form with good code",
        link: 'verificationCode'
    })

}


ServerErrorBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.emailVerification);
ServerErrorBackEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with Back End No Response Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[7]
    })
}

EngRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, successResponse);
EngRequestNewCode.play = async ({ canvasElement, step }) => {

    await successLinkTest({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[12],
        linkText: engPageContentJson[11]
    })
}

FrRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail, SUBMIT_END_POINTS.sendOtpCode, successResponse);
FrRequestNewCode.play = async ({ canvasElement, step }) => {

    await successLinkTest({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: frPageContentJson[12],
        linkText: frPageContentJson[11]
    })
}








