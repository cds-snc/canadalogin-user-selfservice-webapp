declare namespace _default {
    export let title: string;
    export { Password as component };
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
        namespace setErrorCode {
            let action_1: string;
            export { action_1 as action };
        }
        namespace setLocalLoading {
            let action_2: string;
            export { action_2 as action };
        }
    }
}
export default _default;
export const Default: any;
export const WithError: any;
export const WithOtpCode: any;
export const French: any;
import Password from "../../../features/ChangePassword/components/Password.jsx";
