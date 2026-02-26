declare namespace _default {
    export let title: string;
    export { PasswordVerification as component };
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace argTypes {
        namespace setUserPasswordValue {
            let action: string;
        }
        namespace onCancel {
            let action_1: string;
            export { action_1 as action };
        }
        namespace validatePassword {
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
export const PasswordEntered: any;
export const WithError: any;
export const EmailUpdateContext: any;
export const French: any;
import PasswordVerification from "../../../features/TransientOtp/components/PasswordVerification.jsx";
