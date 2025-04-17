import HomePage from "../../views/Home/HomePage.jsx";
import { reactRouterParameters } from 'storybook-addon-remix-react-router';
import {UserProvider} from "../../components/Providers/UserContext.jsx";


export default {
    title: 'GC Sign In/Pages/Landing Page',
    component: HomePage,
    decorators: [
        (Story) => (
            <UserProvider>
                <Story />
            </UserProvider>
        )
    ]
};

export const English = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: 'en' },
            },
            routing: { path: '/:language' },
        }),
    }
};

export const French = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: 'fr' },
            },
            routing: { path: '/:language' },
        }),
    }
};

export const Default = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: '' },
            },
            routing: { path: '' },
        }),
    }
};

