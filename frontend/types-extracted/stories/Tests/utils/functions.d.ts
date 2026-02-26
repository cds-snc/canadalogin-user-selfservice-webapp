interface TestCase {
    canvasElement: any;
    step: any;
    stepMessage: string;
    message: string;
    linkText: string;
    link: string;
    heading: string;
    delay: number;
    type: string;
    actionType: string;
    input: Input;
}
interface Input {
    inputType: string;
    stepMessage: string;
    value: string;
}
interface PathParams {
    language: string;
    flow: string;
    type: string;
}
interface Data {
    pwdMinLength: number;
    pwdMaxLength: number;
}
interface Response {
    success: boolean;
    message: string;
    data: Data;
    status?: number;
}
interface MSW {
    type: string;
    endpoint: string;
    response: Response;
}
export declare function testCase({ canvasElement, step, stepMessage, message, linkText, link, heading, delay, type, actionType, input, }: TestCase): Promise<void>;
export declare const buildTestCase: {
    parameters: (navigationLink: string, pathParams: PathParams, mswArray: Array<MSW>) => {
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
};
export declare const Template: (args: any) => import("react/jsx-runtime").JSX.Element;
export declare const TestTemplate: (args: any) => import("react/jsx-runtime").JSX.Element;
export {};
