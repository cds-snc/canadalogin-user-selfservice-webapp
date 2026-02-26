declare namespace _default {
    export let title: string;
    export { OtpVerification as component };
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace argTypes {
        namespace setUserOtpValue {
            let action: string;
        }
        namespace onBack {
            let action_1: string;
            export { action_1 as action };
        }
        namespace requestOtpCode {
            let action_2: string;
            export { action_2 as action };
        }
        namespace validateOtpCode {
            let action_3: string;
            export { action_3 as action };
        }
        namespace setErrorCode {
            let action_4: string;
            export { action_4 as action };
        }
    }
}
export default _default;
export const SMSVerification: any;
export const VoiceCallVerification: any;
export const EmailVerification: any;
export const PartialInput: any;
export const CompleteInput: any;
export const WithError: any;
export const FrenchLanguage: any;
import OtpVerification from "../../../features/TransientOtp/components/OtpVerification.jsx";
