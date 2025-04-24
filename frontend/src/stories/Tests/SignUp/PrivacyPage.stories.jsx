import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES
} from "../../../utils/constants.jsx";
import { buildTestCase, testCase, TestTemplate } from "../utils/functions.tsx";
import { ACTION_TYPES, TEST_TYPES } from "../utils/constants.jsx";

export default {
    title: 'GC Sign In/Tests/Sign Up/Privacy Page',
    args: { page: PAGES.privacy },
    parameters: buildTestCase.parameters(
        NAVIGATION_LINKS.privacy,
        { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
        []
    )
};

export const PrivacyNavigate = TestTemplate.bind({});
PrivacyNavigate.parameters = buildTestCase.parameters(
    NAVIGATION_LINKS.privacy,
    { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.signUp },
    []
);
PrivacyNavigate.play = async ({ canvasElement, step }) => {
    await testCase({
        canvasElement,
        step,
        stepMessage: "Click Privacy page submit button and navigate to Sign Up page",
        link: 'privacy',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect,
        expectedNavigation: `/${AVAILABLE_LANGUAGES.en}${NAVIGATION_LINKS.signUp}`
    });
};
