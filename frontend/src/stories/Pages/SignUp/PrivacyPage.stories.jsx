import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, NAVIGATION_LINKS, PAGES} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";

import Page from "../../../views/Page.js";


export default {
    title: 'GC Sign In/Pages/Sign Up/Privacy Page',
    component: Page,
    args: {page:PAGES.privacy},
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
                pathParams: { language: AVAILABLE_LANGUAGES.en },
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.privacy }
        }),
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.fr},
            },
            routing: { path: '/:language'+NAVIGATION_LINKS.privacy }
        }),
    }


};


