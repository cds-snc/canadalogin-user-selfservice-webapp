declare namespace _default {
    export let title: string;
    export { EditEmailEnterEmail as component };
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
        namespace onSubmit {
            let action: string;
        }
        namespace onCancel {
            let action_1: string;
            export { action_1 as action };
        }
        namespace handleFormChange {
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
export const FilledForm: any;
export const WithError: any;
export const French: any;
import EditEmailEnterEmail from "../../../features/EmailAddress/EditEmailEnterEmail.jsx";
