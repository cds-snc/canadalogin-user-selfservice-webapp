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
export const MultipleFactorsRadioButtons: any;
export const SingleFactorNoRadios: any;
export const DeleteMFAContext: any;
import OtpSelection from "../../../../features/TransientOtp/components/OtpSelection.jsx";
