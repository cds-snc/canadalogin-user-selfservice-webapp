declare namespace _default {
    export let title: string;
    export { OtpSelection as component };
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
        namespace onChangeUserSelectedMfaFactor {
            let action_2: string;
            export { action_2 as action };
        }
    }
}
export default _default;
export const SingleSMSFactor: any;
export const SingleVoiceFactor: any;
export const MultipleFactors: any;
export const DeleteMFAContext: any;
export const NoFactors: any;
export const French: any;
import OtpSelection from "../../../features/TransientOtp/components/OtpSelection.jsx";
