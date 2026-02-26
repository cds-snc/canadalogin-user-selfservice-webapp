declare namespace _default {
    export let title: string;
    export { ConfirmUpdate as component };
    export let decorators: ((Story: any, context: any) => import("react/jsx-runtime").JSX.Element)[];
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace argTypes {
        namespace onNext {
            let action: string;
        }
        namespace onCancel {
            let action_1: string;
            export { action_1 as action };
        }
        namespace setErrorCode {
            let action_2: string;
            export { action_2 as action };
        }
    }
}
export default _default;
export const DefaultSMS: any;
export const VoiceConfirmation: any;
export const Loading: any;
export const WithError: any;
export const French: any;
import ConfirmUpdate from "../../../features/ContactPhoneNumber/components/ConfirmUpdate.jsx";
