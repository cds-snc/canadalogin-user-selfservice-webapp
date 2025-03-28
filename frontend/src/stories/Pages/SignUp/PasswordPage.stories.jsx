import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {NAVIGATION_LINKS, SUBMIT_END_POINTS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import PasswordPage from "../../../views/Password/PasswordPage.jsx";
import {http, HttpResponse} from "msw";
import config from "../../../config.jsx";

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
    component: PasswordPage,
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

export const English = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: 'en' },
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
                pathParams: { language: 'fr' },
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

