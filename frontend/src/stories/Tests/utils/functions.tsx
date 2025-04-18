import {expect, userEvent, within} from "@storybook/test";
import {reactRouterParameters} from "storybook-addon-remix-react-router";
import {http, HttpResponse} from "msw";
import config from "../../../config.jsx";
import {ACTION_TYPES, POLICY_RESPONSE, TEST_TYPES} from "./constants.jsx";
import Page from "../../../views/Page.js";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {AVAILABLE_LANGUAGES, FLOW_TYPES, PAGES, SUBMIT_END_POINTS} from "../../../utils/constants";


const stepErrorMessage = 'Verify error message is on Page.';
const stepSuccessMessage = 'Verify success message is on Page.';
const stepNavigateMessage = 'Verify page was navigated properly.';

interface TestCase {
    canvasElement: any,
    step: any,
    stepMessage: string,
    message: string,
    linkText: string,
    link: string,
    heading: string,
    delay: number,
    type: string,
    actionType: string,
    input: Input
}

interface Input{
    inputType: string,
    stepMessage:string,
    value: string
}

interface PathParams{
    language: string,
    flow: string,
    type: string
}

interface Data{
    "pwdMinLength": number,
    "pwdMaxLength": number,
}

interface Response{
    success: boolean,
    message: string,
    data: Data
}

interface MSW {
    type: string,
    endpoint: string,
    response: Response
}

const mswMapping = new Map<string, MSW>([
    ["Password Policy", {type:"get", endpoint: SUBMIT_END_POINTS.requestPasswordPolicy, response:POLICY_RESPONSE }]
]);

const pageToMswMapping = new Map<string, Array<string>>([
    [PAGES.password, ["Password Policy"] ]
]);

export async function testCase({ canvasElement, step, stepMessage, message, linkText, link, heading, delay, type, actionType, input }:TestCase) {

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
   canvas: async(canvasElement:any, timeToWait:number)=>{
        const canvas = within(canvasElement);
        await new Promise((r) => setTimeout(r, timeToWait));
        return canvas;
    },
    typeInInput: async(canvas:any, step:any, input:Input) =>{
        await step(input.stepMessage, async () => {
            const placeholder= canvas.queryByRole('textbox');
            await userEvent.type(placeholder, input.value);
            await userEvent.tab();
        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    clickButton: async(canvas:any, step:any, message:string) =>{
        await step(message, async () => {
            await userEvent.click(canvas.queryByRole('button', {name: /test/i}));
        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    queryPageText: async(canvas:any, step:any, message:string, text:string) =>{
        await step(message, async () => {
            await expect(canvas.queryByText(text)).toBeInTheDocument();
        });
    },
    clickLink: async(canvas:any, step:any, stepMessage:string, linkText:string)=>{
        await step(stepMessage, async () => {
            const link = canvas.queryByText(linkText);
            await expect(link).toBeInTheDocument();
            await userEvent.click(link)

        });
        await new Promise((r) => setTimeout(r, 1000));
    },
    checkErrorMsg: async(canvas:any, step:any, stepMessage:string, link:string, message:string, heading:string)=>{
        await step(stepMessage, async () => {
            const errorSummary = await canvas.queryByTestId('errorSummary');
            await expect(errorSummary).toBeInTheDocument();
            await expect(errorSummary.getAttribute('error-links')).toEqual("{\"#"+link+"\": \""+message+"\"}");
            await expect(errorSummary.getAttribute('heading')).toEqual(heading);
        });
    },
    checkAttribute: async(canvas:any, step:any, stepMessage:string, message:string, attribute:string, testId:string) =>{
        await step(stepMessage, async () => {
            const linkSuccess = await canvas.queryByTestId(testId);
            await expect(linkSuccess).toBeInTheDocument();
            await expect(linkSuccess).toHaveAttribute(attribute, message);
        });
    }
}

export const buildTestCase ={
    parameters: (navigationLink:string, pathParams:PathParams, page:string)=>{

        const routingPath = buildPath(pathParams, navigationLink);
        const reactRoutingParameters = buildRoutingParams(pathParams, routingPath);
        const mswResponse = buildMswMapping(page)

        return {
            ...reactRoutingParameters,
            ...mswResponse
        };
    },
}

function buildPath(pathParams:PathParams, navigationLink:string){

    if(pathParams.type !== undefined)
        return {path: '/:language' + '/:flow' + navigationLink+'/:type'}

    return {path: '/:language' + '/:flow' + navigationLink}

}

function buildRoutingParams(pathParams: PathParams, routingPath: { path: string }){

    return {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: {...pathParams},
            },
            routing: routingPath
        })
    }
}

function buildMswMapping(page:string){

    let handlers = [];
    const pages = pageToMswMapping.get(page);

    if(pages!==undefined)
        pages.forEach((response, key)=>{
            const msw =  mswMapping.get(response);
            if(msw.type==='get')
                handlers.push(http.get(`${config.apiUrl}${msw.endpoint}`, async () => {return HttpResponse.json(msw.response);}));
            else if(msw.type==='post')
                handlers.push(http.post(`${config.apiUrl}${msw.endpoint}`, async () => {return HttpResponse.json(msw.response);}));
        });

    if(handlers.length){
        return {
            msw: {
                handlers: handlers
            }
        }
    }
    return null;
}

export const Template = (args:any) =>   {
    return(<UserProvider><Page page={args.page}/></UserProvider>);
}

