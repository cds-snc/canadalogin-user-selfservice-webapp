import HomePage from "../../views/Home/HomePage.jsx";
import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';


export default {
    title: 'GC Sign In/Pages/Landing Page',
    component: HomePage,
    decorators: [withRouter],
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ['autodocs'],

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

