declare namespace _default {
    export let title: string;
    export { TestTemplate as component };
    export namespace args {
        let page: string;
        let email: string;
        let phone: string;
        let id: string;
        let firstName: string;
        let lastName: string;
        let password: string;
    }
}
export default _default;
export namespace EditProfileName {
    let parameters: {
        reactRouter: {
            routePath: string;
            routeParams: {
                language: string;
            };
            routing: {
                path: string;
                routes: {
                    path: string;
                    children: {
                        path: string;
                        element: any;
                    }[];
                }[];
            };
            location: {
                pathParams: {
                    language: string;
                };
            };
        };
        test: {
            dangerouslyIgnoreUnhandledErrors: boolean;
        };
        msw: {
            handlers: any[];
        };
    };
    function play({ canvasElement, step }: {
        canvasElement: any;
        step: any;
    }): Promise<void>;
}
import { TestTemplate } from "../../utils/functions.tsx";
