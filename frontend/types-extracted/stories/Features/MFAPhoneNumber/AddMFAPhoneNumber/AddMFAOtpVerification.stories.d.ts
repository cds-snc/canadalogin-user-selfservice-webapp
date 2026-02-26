declare namespace _default {
    export let title: string;
    export { AddMFAOtpVerification as component };
    export namespace parameters {
        let layout: string;
    }
    export namespace argTypes {
        namespace onNext {
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
        namespace onChangePhoneForm {
            let action_3: string;
            export { action_3 as action };
        }
        namespace requestNewOtpCode {
            let action_4: string;
            export { action_4 as action };
        }
        namespace setErrorCode {
            let action_5: string;
            export { action_5 as action };
        }
    }
}
export default _default;
export const SMSVerification: any;
export const VoiceVerification: any;
export const WithOtpCode: any;
import AddMFAOtpVerification from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAOtpVerification.jsx";
