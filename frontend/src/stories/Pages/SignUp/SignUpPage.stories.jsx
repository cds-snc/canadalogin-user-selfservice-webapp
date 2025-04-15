import { withRouter } from 'storybook-addon-remix-react-router';
import {AVAILABLE_LANGUAGES, FLOW_TYPES, NAVIGATION_LINKS, PAGES} from "../../../utils/constants.jsx";
import {UserProvider} from "../../../components/Providers/UserContext.jsx";
import Page from "../../../views/Page";
import {storyParametersNew} from "../../Tests/utils/functions.jsx";


const frontEndStoryParameters = {
    isBackEndTest:false,
    link:NAVIGATION_LINKS.signUp,
    flow:FLOW_TYPES.signUp
}

export default {
    title: 'GC Sign In/Pages/Sign Up/Sign Up Page',
    component: Page,
    args: {page:PAGES.signup},
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

export const English={
    parameters: storyParametersNew({
                           ...frontEndStoryParameters,
                           language:AVAILABLE_LANGUAGES.en
                       })
};

export const French = {
    parameters: storyParametersNew({
        ...frontEndStoryParameters,
        language:AVAILABLE_LANGUAGES.fr
    })


};

