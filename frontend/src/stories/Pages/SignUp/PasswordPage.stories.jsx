
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES, SUBMIT_END_POINTS
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.jsx";

const policy = {

    "success": true,
    "message": "Password policy retrieved successfully",
    "data": {
        "passwordMinAlphaChars": 0,
        "passwordMinOtherChars": 1,
        "pwdMinAge": 0,
        "pwdExpireWarning": 0,
        "pwdInHistory": 3,
        "pwdLockout": true,
        "pwdLockoutDuration": 15,
        "pwdMaxAge": 0,
        "pwdMaxFailure": 5,
        "pwdMinLength": 12,
        "pwdMaxLength": 65,
        "pwdCheckSyntax": 1
    }

}


export default {
    title: 'GC Sign In/Pages/Sign In/Password Page',
    args:{
        page:PAGES.password
    }
};

const mswResponse = {type:"get", endpoint: SUBMIT_END_POINTS.requestPasswordPolicy, response:policy }

export const English  = Template.bind({});
English.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp }, mswResponse);

export const French  = Template.bind({});
French.parameters = buildTestCase.parameters(NAVIGATION_LINKS.password, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.email }, mswResponse);