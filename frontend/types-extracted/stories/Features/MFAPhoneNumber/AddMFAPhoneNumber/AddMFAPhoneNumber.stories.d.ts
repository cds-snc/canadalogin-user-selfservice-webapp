declare namespace _default {
    export let title: string;
    export { AddMFAPhoneNumber as component };
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
        namespace onChangePhoneForm {
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
export const WithPhoneNumber: any;
export const WithError: any;
import AddMFAPhoneNumber from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddMFAPhoneNumber.jsx";
