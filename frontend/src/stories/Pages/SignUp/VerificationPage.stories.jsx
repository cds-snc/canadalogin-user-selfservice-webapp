import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {NAVIGATION_LINKS} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import VerificationPage from "../../../views/SignUp/VerificationPage.jsx";



export default {
    title: 'GC Sign In/Pages/Sign Up/Verification Page',
    component: VerificationPage,
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
            routing: { path: '/:language'+NAVIGATION_LINKS.verification }
        }),
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: 'fr' },
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.verification }
        }),
    }


};

