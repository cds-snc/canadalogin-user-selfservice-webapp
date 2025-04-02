import {expect, userEvent, within} from "@storybook/test";
import {reactRouterParameters} from "storybook-addon-remix-react-router";
import {http, HttpResponse} from "msw";
import config from "../../config.jsx";


export async function successSummaryTest({ canvasElement, step, message }) {
    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step(message, async () => {
        await userEvent.click(canvas.queryByRole('button', {name: /test/i}));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify page was navigated properly.', async () => {
        //need to see if possible to test further
        await expect(canvas.queryByText("404 Not Found")).toBeInTheDocument();
    });

}

export async function successLinkTestNewPage({ canvasElement, step, stepMessage, message, linkText }) {
    const canvas = await within(canvasElement);
    console.log(linkText);
    await new Promise((r) => setTimeout(r, 11000));


    await step(stepMessage, async () => {
        const link = canvas.queryByText(linkText);
        console.log(link)
        await expect(link).toBeInTheDocument();
        await userEvent.click(link)

    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify page was navigated properly.', async () => {
        //need to see if possible to test further
        await expect(canvas.queryByText("404 Not Found")).toBeInTheDocument();
    });
}


export async function successLinkTest({ canvasElement, step, stepMessage, message, linkText }) {
    const canvas = await within(canvasElement);
    console.log(linkText);
    await new Promise((r) => setTimeout(r, 11000));


    await step(stepMessage, async () => {
        const link = canvas.queryByText(linkText);
        console.log(link)
        await expect(link).toBeInTheDocument();
        await userEvent.click(link)

    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify success message is on Page.', async () => {
        const linkSuccess = await canvas.queryByTestId('linkSuccess');
        await expect(linkSuccess).toBeInTheDocument();
        await expect(linkSuccess).toHaveAttribute("notice-title", message);
    });
}

export async function errorSummaryTest({ canvasElement, step, message, link, heading, error, isName }) {
    const canvas = await within(canvasElement);
    await new Promise((r) => setTimeout(r, 1000));

    await step(message, async () => {
        await userEvent.click(canvas.queryByRole('button', {name: /test/i}));
    });

    await new Promise((r) => setTimeout(r, 1000));

    await step('Verify Error Summary was populated.', async () => {
        const errorSummary = await canvas.queryByTestId('errorSummary');
        await expect(errorSummary).toBeInTheDocument();
        await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#"+link+"\": \""+error+"\"}");
        await expect(errorSummary).toHaveAttribute("heading", heading);
    });
}

export function storyParameters(isBackEndTest, language, link, endpoint, response){

    if(isBackEndTest)
        return { reactRouter: reactRouterParameters({
                location: {
                    pathParams: {language},
                },
                routing: {path: '/:language' + link}
            }),
            msw: {
                handlers: [
                    http.post(`${config.apiUrl}${endpoint}`, async () => {
                        return HttpResponse.json(response);
                    }),
                ],
            }
    }

    return {

        reactRouter: reactRouterParameters({
            location: {
                pathParams: {language},
            },
            routing: {path: '/:language' + link}
        })
    };
}