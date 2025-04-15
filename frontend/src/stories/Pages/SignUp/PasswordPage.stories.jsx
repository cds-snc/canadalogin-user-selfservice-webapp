import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {
    AVAILABLE_LANGUAGES,
    NAVIGATION_LINKS,
    PAGES,
    SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import {http, HttpResponse} from "msw";
import config from "../../../config.jsx";
import Page from "../../../views/Page.js";

const policy = {

    "success": true,
    "message": "Password policy retrieved successfully",
    "data": {
    "passwordMinAlphaChars": 0,
        "passwordMinOtherChars": 1,
        "pwdMinAge": 0,
        "pwdExpireWarning": 0,
        "pwdInHistory": 3,
        "pwdLockout": true,
        "pwdLockoutDuration": 15,
        "pwdMaxAge": 0,
        "pwdMaxFailure": 5,
        "pwdMinLength": 15,
        "pwdMaxLength": 65,
        "pwdCheckSyntax": 1
    }

}

export default {
    title: 'GC Sign In/Pages/Sign Up/Password Page',
    component: Page,
    args: {page:PAGES.password},
    decorators: [withRouter,
        (Story) => (
            <UserProvider>
                <Story />
            </UserProvider>
        )
    ],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

};

export const English ={
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.en },
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.password }
        }),
        msw: {
            handlers: [
                http.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`, async () => {
                    return HttpResponse.json(policy);
                }),
            ],
        }
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.fr },
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.password }
        }),
        msw: {
            handlers: [
                http.get(`${config.apiUrl}${SUBMIT_END_POINTS.requestPasswordPolicy}`, async () => {
                    return HttpResponse.json(policy);
                }),
            ],
        }
    }

};

