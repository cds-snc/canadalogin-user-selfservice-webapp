declare namespace _default {
    export let title: string;
    export { TestTemplate as component };
    export namespace parameters {
        let layout: string;
        namespace docs {
            namespace description {
                let component: string;
            }
        }
    }
    export namespace args {
        let page: string;
        let email: string;
        let phone: string;
        let id: string;
        let otpType: string;
        let passwordValidated: boolean;
        let firstName: string;
        let lastName: string;
        let password: string;
    }
}
export default _default;
export const Default: any;
export const French: any;
import { TestTemplate } from "../../../Tests/utils/functions.tsx";
