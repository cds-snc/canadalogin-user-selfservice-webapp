import { withRouter, reactRouterParameters } from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, FLOW_TYPES, NAVIGATION_LINKS, PAGES} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import Page from "../../../views/Page.tsx";



export default {
    title: 'GC Sign In/Pages/Sign In/Verification Page',
    component: Page,
    args: {page:PAGES.verification},
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

export const SMSEnglish = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        })
    }
};

export const SMSFrench = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.fr , flow: FLOW_TYPES.signIn, type:FLOW_TYPES.sms },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        }),
    }
};


export const VoiceEnglish = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        })
    }
};

export const VoiceFrench = {
    parameters: {
        reactRouter: reactRouterParameters({
            location: {
                pathParams: { language: AVAILABLE_LANGUAGES.fr , flow: FLOW_TYPES.signIn, type:FLOW_TYPES.voice },
            },
            routing: { path: '/:language'+'/:flow'+NAVIGATION_LINKS.verification+'/:type' }
        }),
    }
};



