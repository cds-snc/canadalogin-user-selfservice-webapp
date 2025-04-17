import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.tsx";

export default {
    title: 'GC Sign In/Pages/Sign Up/Sign Up Page',
    args:{
        page:PAGES.signup
    }
};

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.signUp, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp }, null);

export const French  = Template.bind({});
French.parameters =buildTestCase.parameters(NAVIGATION_LINKS.signUp, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp }, null);