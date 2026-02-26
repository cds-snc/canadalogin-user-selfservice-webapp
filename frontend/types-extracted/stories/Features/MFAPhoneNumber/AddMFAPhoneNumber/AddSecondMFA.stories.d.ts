declare namespace _default {
    export let title: string;
    export { AddSecondMFA as component };
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
    }
}
export default _default;
export const Default: any;
export const French: any;
import AddSecondMFA from "../../../../features/MFAPhoneNumber/AddMFAPhoneNumber/component/AddSecondMFA.jsx";
