import {expect, userEvent, within} from "@storybook/test";
import {reactRouterParameters} from "storybook-addon-remix-react-router";
import {http, HttpResponse} from "msw";
import config from "../../config.jsx";
import {ACTION_TYPES, TEST_TYPES} from "./constants.jsx";

const stepErrorMessage = 'Verify error message is on Page.';
const stepSuccessMessage = 'Verify error message is on Page.';
const stepNavigateMessage = 'Verify page was navigated properly.';

export async function testCase({ canvasElement, step, stepMessage, message, linkText, link, heading, delay, type, actionType, input }) {

    const canvas = await testItem.canvas(canvasElement, delay);


    if(input!==undefined)
        switch(input.inputType) {
            case('textBox'):
                await testItem.typeInInput(canvas, step, input);
                break;
        }

    switch (actionType) {
        case(ACTION_TYPES.link):
            await testItem.clickLink(canvas, step, stepMessage, linkText);
            break;
        case(ACTION_TYPES.submit):
            await testItem.clickButton(canvas, step, message);
            break;
        default:
            await expect(false).toBeTruthy();
            break;
    }

    switch (type) {
        case(TEST_TYPES.error):
            await testItem.checkErrorMsg(canvas, step, stepErrorMessage, link, message, heading);
            break;
        case(TEST_TYPES.success):
            await testItem.checkAttribute(canvas, step, stepSuccessMessage, message, 'notice-title', 'linkSuccess');
            break;
        case(TEST_TYPES.redirect):
            //need to investigate further
            await testItem.queryPageText(canvas, step, stepNavigateMessage, "404 Not Found" );
            break;
        default:
            await expect(false).toBeTruthy();
            break;
    }
}

export function storyParameters(isBackEndTest, language, link, endpoint, response, type){

    if(isBackEndTest)
        if(type)
            return { reactRouter: reactRouterParameters({
                    location: {
                        pathParams: {language, type},
                    },
                    routing: {path: '/:language' + link + '/:type'}
                }),
                msw: {
                    handlers: [
                        http.post(`${config.apiUrl}${endpoint}`, async () => {
                            return HttpResponse.json(response);
                        }),
                    ],
                }
            }
        else
            return { reactRouter: reactRouterParameters({
                    location: {
                        pathParams: {language},
                    },
                    routing: {path: '/:language' + link }
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


export function storyParametersNew({isBackEndTest, language, link, endpoint, response, type, flow}){

    if(isBackEndTest)
        if(type)
            return { reactRouter: reactRouterParameters({
                    location: {
                        pathParams: {language, flow, type},
                    },
                    routing: {path: '/:language' +'/:flow'+ link + '/:type'}
                }),
                msw: {
                    handlers: [
                        http.post(`${config.apiUrl}${endpoint}`, async () => {
                            return HttpResponse.json(response);
                        }),
                    ],
                }
            }
        else
            return { reactRouter: reactRouterParameters({
                    location: {
                        pathParams: {language, flow},
                    },
                    routing: {path: '/:language' +'/:flow'+ link }
                }),
                msw: {
                    handlers: [
                        http.post(`${config.apiUrl}${endpoint}`, async () => {
                            return HttpResponse.json(response);
                        }),
                    ],
                }
            }
    if(type)
        return {

            reactRouter: reactRouterParameters({
                location: {
                    pathParams: {language, flow, type},
                },
                routing: {path: '/:language' +'/:flow'+ link+ '/:type'}
            })
        };
    else
        return {

            reactRouter: reactRouterParameters({
                location: {
                    pathParams: {language, flow},
                },
                routing: {path: '/:language' +'/:flow'+ link}
            })
        };
}

const testItem = {
   canvas: async(canvasElement, timeToWait)=>{
        const canvas = await within(canvasElement);
        await new Promise((r) => setTimeout(r, timeToWait));
        return canvas;
    },
    typeInInput: async(canvas, step, input) =>{
        await step(input.stepMessage, async () => {
            const placeholder= canvas.queryByRole('textbox');
            await userEvent.type(placeholder, input.value);
            await userEvent.tab();
        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    clickButton: async(canvas, step, message) =>{
        await step(message, async () => {
            await userEvent.click(canvas.queryByRole('button', {name: /test/i}));
        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    queryPageText: async(canvas, step, message, text) =>{
        await step(message, async () => {
            await expect(canvas.queryByText(text)).toBeInTheDocument();
        });
    },
    clickLink: async(canvas, step, stepMessage, linkText)=>{

        await step(stepMessage, async () => {
            const link = canvas.queryByText(linkText);
            await expect(link).toBeInTheDocument();
            await userEvent.click(link)

        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    checkErrorMsg: async(canvas, step, stepMessage, link, message, heading)=>{
        await step(stepMessage, async () => {
            const errorSummary = await canvas.queryByTestId('errorSummary');
            await expect(errorSummary).toBeInTheDocument();
            await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#"+link+"\": \""+message+"\"}");
            await expect(errorSummary.getAttribute('heading')).toEqual(heading);
        });
    },
    checkAttribute: async(canvas, step, stepMessage, message, attribute, testId) =>{
        await step(stepMessage, async () => {
            const linkSuccess = await canvas.queryByTestId(testId);
            await expect(linkSuccess).toBeInTheDocument();
            await expect(linkSuccess).toHaveAttribute(attribute, message);
        });
    },
    routingParameters: async (language, link) => {
       return {
           reactRouter: reactRouterParameters({
               location: {
                   pathParams: {language},
               },
               routing: {path: '/:language' + link}
           })
       };
    }
}