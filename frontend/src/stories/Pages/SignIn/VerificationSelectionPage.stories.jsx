
import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import {buildTestCase, Template} from "../../Tests/utils/functions.tsx";

export default {
    title: 'GC Sign In/Pages/Sign In/Verification Selection Page',
    args:{
        page:PAGES.verificationSelection
    }
};

export const SMSEnglish  = Template.bind({});
SMSEnglish.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection, {language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn}, null);

export const SMSFrench  = Template.bind({});
SMSFrench.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection, {language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn}, null);

export const VoiceEnglish  = Template.bind({});
VoiceEnglish.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection, {language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signIn}, null);

export const VoiceFrench  = Template.bind({});
VoiceFrench.parameters = buildTestCase.parameters(NAVIGATION_LINKS.verificationSelection, {language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.signIn}, null);
