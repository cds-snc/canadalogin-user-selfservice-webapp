
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.jsx";




export default {
    title: 'GC Sign In/Pages/Sign Up/Email Verification Page',
    args:{
        page:PAGES.verification
    }
};

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email }, null);

export const French  = Template.bind({});
French.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email }, null);