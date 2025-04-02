import SignUpPage from "../../../views/SignUp/SignUpPage";
import {reactRouterParameters, withRouter} from 'storybook-addon-remix-react-router';
import {NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {expect, userEvent, within} from '@storybook/test';
import {getPageContent} from "../../../utils/functions.jsx";
import config from "../../../config.jsx";
import {http, HttpResponse} from "msw";
import {TestDataUserProvider} from "../constants.jsx";

const serverError =  "value is not a valid email address: There must be something after the @-sign.";
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

export default {

    title: 'GC Sign In/Tests/Sign Up/Sign Up Page',
    component: SignUpPage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};


const BadEmailTemplateFE = (args) =>   {

    TestDataUserProvider.testData.email = "test@test";

    return(
        <UserProvider initial={TestDataUserProvider}><SignUpPage /><button type="submit"  form="emailForm"></button></UserProvider>
    )
}

const EmailTemplateBE = (args) =>   {

    TestDataUserProvider.testData.email = "test@test.com";

    return(
        <UserProvider initial={TestDataUserProvider}><SignUpPage /><button type="submit"  form="emailForm"></button></UserProvider>
    )
}

export const EngWithBadEmailFrontEndTest = BadEmailTemplateFE.bind({});
export const FrenchWithBadEmail = BadEmailTemplateFE.bind({});
export const BadEmailBackEndTest = EmailTemplateBE.bind({});
export const SuccessfulEmailBackEndTest = EmailTemplateBE.bind({});
export const ServerErrorBackEndTest = EmailTemplateBE.bind({});ServerErrorBackEndTest

EngWithBadEmailFrontEndTest.parameters = {

    reactRouter: reactRouterParameters({
        location: {
            pathParams: { language: 'en' },
        },
        routing: { path: '/:language'+NAVIGATION_LINKS.signUp }
    })
}

EngWithBadEmailFrontEndTest.play = async ({ canvasElement, step }) => {

    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step('Submit form with bad email in English', async () => {
        await userEvent.click(canvas.queryByRole('button'));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify Error Summary was populated.', async () => {
        const errorSummary = await canvas.queryByTestId('errorSummary');
        await expect(errorSummary).toBeInTheDocument();
        await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#email\": \""+engErrorPageJson[2]+"\"}");
        await expect(errorSummary).toHaveAttribute("heading", engErrorPageJson['1']);
    });

}

FrenchWithBadEmail.parameters = {

    reactRouter: reactRouterParameters({
        location: {
            pathParams: { language: 'fr' },
        },
        routing: { path: '/:language'+NAVIGATION_LINKS.signUp }
    }),

}

FrenchWithBadEmail.play = async ({ canvasElement, step }) => {

    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step('Submit form with bad email in French', async () => {
        await userEvent.click(canvas.queryByRole('button'));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify Error Summary was populated.', async () => {
        const errorSummary = await canvas.queryByTestId('errorSummary');
        await expect(errorSummary).toBeInTheDocument();
        await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#email\": \""+frErrorPageJson[2]+"\"}");
        await expect(errorSummary).toHaveAttribute("heading", frErrorPageJson['1']);
    });

}

BadEmailBackEndTest.parameters = {

    reactRouter: reactRouterParameters({
        location: {
            pathParams: { language: 'en' },
        },
        routing: { path: '/:language'+NAVIGATION_LINKS.signUp }
    }),
    msw: {
        handlers: [
            http.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, async () => {
                return HttpResponse.json(errorResponse);
            }),
        ],
    },
}

BadEmailBackEndTest.play = async ({ canvasElement, step }) => {

    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step('Submit form with bad email in English For Back End Error', async () => {
        await userEvent.click(canvas.queryByRole('button'));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify Error Summary was populated.', async () => {
        const errorSummary = await canvas.queryByTestId('errorSummary');
        await expect(errorSummary).toBeInTheDocument();
        await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#email\": \""+serverError+"\"}");
        await expect(errorSummary).toHaveAttribute("heading", engErrorPageJson['1']);
    });

}

SuccessfulEmailBackEndTest.parameters = {

    reactRouter: reactRouterParameters({
        location: {
            pathParams: { language: 'en' },
        },
        routing: { path: '/:language'+NAVIGATION_LINKS.signUp }
    }),
    msw: {
        handlers: [
            http.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, () => {
                return HttpResponse.json(successResponse);
            }),
        ],
    },
}

SuccessfulEmailBackEndTest.play = async ({ canvasElement, step }) => {

    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step('Submit form with good email in English', async () => {
        await userEvent.click(canvas.queryByRole('button'));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify page was navigated properly.', async () => {
        //need to see if possible to test further
        await expect(canvas.queryByText("404 Not Found")).toBeInTheDocument();
    });

}

ServerErrorBackEndTest.parameters = {

    reactRouter: reactRouterParameters({
        location: {
            pathParams: { language: 'en' },
        },
        routing: { path: '/:language'+NAVIGATION_LINKS.signUp }
    }),
    msw: {
        handlers: [
            http.post(`${config.apiUrl}${SUBMIT_END_POINTS.sendOtpCode}`, () => {
                return null;
            }),
        ],
    },
}

ServerErrorBackEndTest.play = async ({ canvasElement, step }) => {

    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step('Submit form with bad email in English For Back End Error', async () => {
        await userEvent.click(canvas.queryByRole('button'));
    });

    await new Promise((r) => setTimeout(r, 3000));

    await step('Verify page was navigated properly.', async () => {
        //need to see if possible to test further
        const errorSummary = await canvas.queryByTestId('errorSummary');
        await expect(errorSummary).toBeInTheDocument();
        await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#email\": \""+engErrorPageJson['7']+"\"}");
        await expect(errorSummary).toHaveAttribute("heading", engErrorPageJson['1']);
    });

}