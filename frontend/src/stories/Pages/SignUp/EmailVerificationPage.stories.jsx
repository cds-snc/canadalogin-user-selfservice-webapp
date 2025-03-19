import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import {useUser} from "../../../components/Providers/UserContext.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import EmailVerificationPage from "../../../views/SignUp/EmailVerificationPage.jsx";



export default {
    title: 'GC Sign In/Pages/Sign Up/Email Verification Page',
    component: EmailVerificationPage,
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
            routing: { path: '/:language'+NAVIGATION_LINKS.verifyEmail }
        }),
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: 'fr' },
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.verifyEmail }
        }),
    }


};

