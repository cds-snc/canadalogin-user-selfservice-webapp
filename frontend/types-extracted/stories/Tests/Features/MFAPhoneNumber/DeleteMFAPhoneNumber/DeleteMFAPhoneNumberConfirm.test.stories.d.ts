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
        let otp: string;
        function onNext(): void;
        function onCancel(): void;
        namespace phoneFormData {
            let phoneNumber: string;
            let formattedPhoneNumber: string;
            let mfaFactorsToDelete: {
                id: string;
                type: string;
                phoneNumber: string;
            }[];
        }
    }
}
export default _default;
export namespace ConfirmationPageDisplay {
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
export namespace DeleteButtonPresent {
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
export namespace CancelButtonPresent {
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
export namespace ClickDeleteButton {
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
export namespace ClickCancelButton {
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
export namespace MultipleFactorsToDelete {
    export namespace args_1 {
        export namespace phoneFormData_1 {
            let phoneNumber_1: string;
            export { phoneNumber_1 as phoneNumber };
            let formattedPhoneNumber_1: string;
            export { formattedPhoneNumber_1 as formattedPhoneNumber };
            let mfaFactorsToDelete_1: {
                id: string;
                type: string;
                phoneNumber: string;
            }[];
            export { mfaFactorsToDelete_1 as mfaFactorsToDelete };
        }
        export { phoneFormData_1 as phoneFormData };
    }
    export { args_1 as args };
    let parameters_5: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_5 as parameters };
    export function play_5({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_5 as play };
}
export namespace DifferentPhoneFormat {
    export namespace args_2 {
        export namespace phoneFormData_2 {
            let phoneNumber_2: string;
            export { phoneNumber_2 as phoneNumber };
            let formattedPhoneNumber_2: string;
            export { formattedPhoneNumber_2 as formattedPhoneNumber };
            let mfaFactorsToDelete_2: {
                id: string;
                type: string;
                phoneNumber: string;
            }[];
            export { mfaFactorsToDelete_2 as mfaFactorsToDelete };
        }
        export { phoneFormData_2 as phoneFormData };
    }
    export { args_2 as args };
    let parameters_6: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_6 as parameters };
    export function play_6({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_6 as play };
}
export namespace EmptyPhoneFormData {
    export namespace args_3 {
        export namespace phoneFormData_3 {
            let phoneNumber_3: string;
            export { phoneNumber_3 as phoneNumber };
            let formattedPhoneNumber_3: string;
            export { formattedPhoneNumber_3 as formattedPhoneNumber };
            let mfaFactorsToDelete_3: any[];
            export { mfaFactorsToDelete_3 as mfaFactorsToDelete };
        }
        export { phoneFormData_3 as phoneFormData };
    }
    export { args_3 as args };
    let parameters_7: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_7 as parameters };
    export function play_7({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_7 as play };
}
export namespace VoiceOtpFactor {
    export namespace args_4 {
        export namespace phoneFormData_4 {
            let phoneNumber_4: string;
            export { phoneNumber_4 as phoneNumber };
            let formattedPhoneNumber_4: string;
            export { formattedPhoneNumber_4 as formattedPhoneNumber };
            let mfaFactorsToDelete_4: {
                id: string;
                type: string;
                phoneNumber: string;
            }[];
            export { mfaFactorsToDelete_4 as mfaFactorsToDelete };
        }
        export { phoneFormData_4 as phoneFormData };
    }
    export { args_4 as args };
    let parameters_8: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_8 as parameters };
    export function play_8({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_8 as play };
}
export namespace GridLayoutPresent {
    let parameters_9: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_9 as parameters };
    export function play_9({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_9 as play };
}
export namespace PhoneNumberEmphasis {
    let parameters_10: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_10 as parameters };
    export function play_10({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_10 as play };
}
export namespace AllGcdsComponentsRender {
    let parameters_11: {
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
        reactRouter: import("storybook-addon-remix-react-router").ReactRouterAddonStoryParameters;
    };
    export { parameters_11 as parameters };
    export function play_11({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
    export { play_11 as play };
}
import { TestTemplate } from "../../../utils/functions.tsx";
