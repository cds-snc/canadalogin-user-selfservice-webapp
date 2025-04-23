import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.tsx";
import {MSW_PASSWORD_POLICY} from "../../Tests/utils/constants.jsx";

export default {
    title: 'GC Sign In/Pages/Sign In/Password Page',
    args:{
        page:PAGES.password
    }
};

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },  [MSW_PASSWORD_POLICY]);

export const French  = Template.bind({});
French.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email }, [MSW_PASSWORD_POLICY]);