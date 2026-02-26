declare namespace _default {
    export let title: string;
    export { EmailConfirmUpdate as component };
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
    }
}
export default _default;
export const Default: any;
export const LongEmailAddress: any;
export const NoFormData: any;
export const French: any;
import EmailConfirmUpdate from "../../../features/EmailAddress/EmailConfirmUpdate.jsx";
