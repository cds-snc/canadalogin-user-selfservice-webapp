declare namespace _default {
    export let title: string;
    export { EnterPhoneNumber as component };
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
        namespace onChangePhoneForm {
            let action_2: string;
            export { action_2 as action };
        }
        namespace setErrorCode {
            let action_3: string;
            export { action_3 as action };
        }
    }
}
export default _default;
export const Default: any;
export const FilledFormSMS: any;
export const FilledFormVoice: any;
export const WithError: any;
export const French: any;
import EnterPhoneNumber from "../../../features/ContactPhoneNumber/components/EnterPhoneNumber.jsx";
