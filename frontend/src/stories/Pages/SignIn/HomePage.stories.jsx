import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, FLOW_TYPES, NAVIGATION_LINKS, PAGES} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import Page from "../../../views/Page.js";
import HomePage from "../../../views/Home/HomePage.jsx";



export default {
    title: 'GC Sign In/Pages/Sign In/Home Page Sign In',
    component: HomePage,
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
                pathParams: { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.email },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        }),
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.email },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        }),
    }


};

