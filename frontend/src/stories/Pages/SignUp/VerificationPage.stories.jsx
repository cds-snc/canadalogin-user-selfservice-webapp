
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.jsx";




export default {
    title: 'GC Sign In/Pages/Sign Up/Verification Page',
    args:{
        page:PAGES.verification
    }
};

export const SMSEnglish  = Template.bind({});
SMSEnglish.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms }, null);

export const SMSFrench  = Template.bind({});
SMSFrench.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.sms }, null);

export const VoiceEnglish  = Template.bind({});
VoiceEnglish.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice }, null);

export const VoiceFrench  = Template.bind({});
VoiceFrench.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verification, { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signUp, type:FLOW_TYPES.voice }, null);
