import {reactRouterParameters, withRouter} from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {TestDataUserProvider} from "../constants.jsx";
import EmailVerificationPage from "../../../views/SignUp/EmailVerificationPage.jsx";
import {
    errorSummaryTest,
    storyParameters,
    successLinkTest,
    successLinkTestNewPage,
    successSummaryTest
} from "../functions.jsx";
import VerificationPage from "../../../views/SignUp/VerificationPage.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");
const engPageContentJson = getPageContent('en', "Verification");
const frPageContentJson = getPageContent('fr', "Verification");

const serverError =  "The system cannot process the request because the verification was not found.";
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

export default {

    title: 'GC Sign In/Tests/Sign Up/Verification Page',
    component: VerificationPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

TestDataUserProvider.userData.phone = '+1 (416) 123 - 4567';

const BadEmailTemplateFE = (args) =>   {

    TestDataUserProvider.testData.otp = "12154e";
    return(
        <UserProvider initial={TestDataUserProvider}><VerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

const EmailTemplateBE = (args) =>   {

    TestDataUserProvider.testData.otp = "123456";

    return(
        <UserProvider initial={TestDataUserProvider}><VerificationPage /><button aria-label="test" type="submit"  form="form"></button></UserProvider>
    )
}

export const EngBadFrontEndTest = BadEmailTemplateFE.bind({});
export const FrBadFrontEndTest = BadEmailTemplateFE.bind({});
export const SmsBadBackEndTest = EmailTemplateBE.bind({});
export const SmsSuccessfulBackEndTest = EmailTemplateBE.bind({});
export const VoiceBadBackEndTest = EmailTemplateBE.bind({});
export const VoiceSuccessfulBackEndTest = EmailTemplateBE.bind({});
export const ServerErrorBackEndTest = EmailTemplateBE.bind({});
export const EngRequestNewCode = EmailTemplateBE.bind({});
export const FrRequestNewCode = EmailTemplateBE.bind({});
export const EngRequestNewTypeCode = EmailTemplateBE.bind({});
EngBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/sms");
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

FrBadFrontEndTest.parameters = storyParameters(false, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail+"/sms");
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

SmsBadBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/sms", SUBMIT_END_POINTS.twoStepVerification, errorResponse);
SmsBadBackEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[7]
    })

}

SmsSuccessfulBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/sms", SUBMIT_END_POINTS.twoStepVerification, successResponse);
SmsSuccessfulBackEndTest.play = async ({ canvasElement, step }) => {

    await successSummaryTest({
        canvasElement,
        step,
        message: "Submit form with good code",
        link: 'verificationCode'
    })

}

VoiceBadBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/voice", SUBMIT_END_POINTS.twoStepVerification, errorResponse);
VoiceBadBackEndTest.play = async ({ canvasElement, step }) => {

    await errorSummaryTest({
        canvasElement,
        step,
        message: "Submit form with bad code For Back End Error",
        link: 'verificationCode',
        heading: engErrorPageJson[1],
        error: engErrorPageJson[7]
    })

}

VoiceSuccessfulBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/voice", SUBMIT_END_POINTS.twoStepVerification, successResponse);
VoiceSuccessfulBackEndTest.play = async ({ canvasElement, step }) => {

    await successSummaryTest({
        canvasElement,
        step,
        message: "Submit form with good code",
        link: 'verificationCode'
    })

}

ServerErrorBackEndTest.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+"/voice", SUBMIT_END_POINTS.twoStepVerification);
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


EngRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+'/sms', SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse);
EngRequestNewCode.play = async ({ canvasElement, step }) => {

    await successLinkTest({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[16]
    })
}

FrRequestNewCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.fr, NAVIGATION_LINKS.verifyEmail+'/sms', SUBMIT_END_POINTS.sendTwoStepVerificationCode, successResponse);
FrRequestNewCode.play = async ({ canvasElement, step }) => {

    await successLinkTest({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: frPageContentJson[17],
        linkText: frPageContentJson[16]
    })
}

EngRequestNewTypeCode.parameters = storyParameters(true, AVAILABLE_LANGUAGES.en, NAVIGATION_LINKS.verifyEmail+'/sms', SUBMIT_END_POINTS.sendTwoStepVerificationCodeVoice, successResponse);
EngRequestNewTypeCode.play = async ({ canvasElement, step }) => {

    await successLinkTestNewPage({
        canvasElement,
        step,
        stepMessage: "Successful resend code",
        link: 'verificationCode',
        message: engPageContentJson[17],
        linkText: engPageContentJson[11]
    })
}



