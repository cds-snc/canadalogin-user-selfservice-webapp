declare namespace _default {
    export let title: string;
    export { ConfirmUpdate as component };
    export let decorators: ((Story: any) => import("react/jsx-runtime").JSX.Element)[];
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace argTypes {
        namespace onConfirm {
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
export const Loading: any;
export const WithError: any;
import ConfirmUpdate from "../../../features/ProfileName/components/ConfirmUpdate.jsx";
