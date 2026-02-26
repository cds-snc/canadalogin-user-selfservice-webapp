declare namespace _default {
    export let title: string;
    export { ProfileUpdateName as component };
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
        namespace onNext {
            let action: string;
        }
        namespace onCancel {
            let action_1: string;
            export { action_1 as action };
        }
        namespace onNameFormChange {
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
import ProfileUpdateName from "../../../features/ProfileName/components/ProfileUpdateName.jsx";
