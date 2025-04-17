
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES, SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";

import{POLICY_RESPONSE} from "../../Tests/utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.tsx";

export default {
    title: 'GC Sign In/Pages/Sign Up/Password Page',
    args:{
        page:PAGES.password
    }
};

const mswMapping = new Map();
mswMapping.set("policy", {type:"get", endpoint: SUBMIT_END_POINTS.requestPasswordPolicy, response:POLICY_RESPONSE });

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp }, mswMapping);

export const French  = Template.bind({});
French.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email }, mswMapping);