declare namespace _default {
    export let title: string;
    export { EmailOtpValidation as component };
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
        namespace onBack {
            let action_2: string;
            export { action_2 as action };
        }
        namespace setFormData {
            let action_3: string;
            export { action_3 as action };
        }
        namespace handleChange {
            let action_4: string;
            export { action_4 as action };
        }
        namespace requestOtpCode {
            let action_5: string;
            export { action_5 as action };
        }
    }
}
export default _default;
export const Default: any;
export const WithOtpCode: any;
export const WithError: any;
export const PartialOtpCode: any;
export const French: any;
import EmailOtpValidation from "../../../features/EmailAddress/EmailOtpValidation.jsx";
