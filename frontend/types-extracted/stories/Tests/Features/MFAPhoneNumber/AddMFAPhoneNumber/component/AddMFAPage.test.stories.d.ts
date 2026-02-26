declare namespace _default {
    export let title: string;
    export { TestTemplate as component };
    export namespace args {
        let page: string;
        let email: string;
        let phone: string;
        let id: string;
        let otpType: string;
        let passwordValidated: boolean;
        let firstName: string;
        let lastName: string;
        let password: string;
    }
}
export default _default;
export namespace SelectVoiceCallRadioButton {
    let parameters: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    function play({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
}
export namespace SelectTextMessageRadioButton {
    let parameters_1: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_1 as parameters };
    export function play_1({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_1 as play };
}
export namespace CompleteAddMFAFlowSMS {
    let parameters_2: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_2 as parameters };
    export function play_2({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_2 as play };
}
export namespace ResendOtpCode {
    let parameters_3: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_3 as parameters };
    export function play_3({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_3 as play };
}
export namespace UseDifferentPhoneNumber {
    let parameters_4: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_4 as parameters };
    export function play_4({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_4 as play };
}
import { TestTemplate } from "../../../../utils/functions.tsx";
