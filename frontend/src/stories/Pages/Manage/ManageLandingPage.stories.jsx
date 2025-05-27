import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.tsx";

export default {
    title: 'GC Sign In/Pages/Manage/Manage Landing Page',
    args:{
        page:PAGES.manageHome
    }
};

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.dashboard, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.dashboard }, null);

export const French  = Template.bind({});
French.parameters =buildTestCase.parameters(NAVIGATION_LINKS.dashboard, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.dashboard }, null);
