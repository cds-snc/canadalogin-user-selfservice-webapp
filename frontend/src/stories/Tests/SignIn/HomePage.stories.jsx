import {
    AVAILABLE_LANGUAGES,
    FLOW_TYPES,
    NAVIGATION_LINKS,
    PAGES,
} from "../../../utils/constants.jsx";
import {getPageContent} from "../../../utils/functions.jsx";
import {
    ACTION_TYPES,
    TEST_TYPES,
} from "../utils/constants.jsx";
import {buildTestCase, testCase, TestTemplate} from "../utils/functions.jsx";

const engErrorPageJson = getPageContent('en', "Error");
const frErrorPageJson = getPageContent('fr', "Error");

export default {
    title: 'GC Sign In/Tests/Sign Up/Landing Page',
    args:{
        page: PAGES.home,
        email: "test@test"
    },
    parameters: buildTestCase.parameters(NAVIGATION_LINKS.home,
        { language: AVAILABLE_LANGUAGES.en, flow:FLOW_TYPES.signUp },
        null)
};

export const NoLanguageFrontEnd = TestTemplate.bind({});
export const EngErrorFrontEnd = TestTemplate.bind({});
export const FrErrorFrontEnd = TestTemplate.bind({});
export const SuccessfulSubmit = TestTemplate.bind({});

NoLanguageFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.home,
    { flow:FLOW_TYPES.signUp },
    null);

NoLanguageFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with no language selected",
        link: 'email',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[2],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

EngErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad email in English",
        link: 'email',
        heading: engErrorPageJson[1],
        message: engErrorPageJson[2],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

FrErrorFrontEnd.parameters = buildTestCase.parameters(NAVIGATION_LINKS.home,
    {language:AVAILABLE_LANGUAGES.fr, flow:FLOW_TYPES.signUp },
    null);

FrErrorFrontEnd.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage:"Submit form with bad email in French",
        link: 'email',
        heading: frErrorPageJson[1],
        message: frErrorPageJson[2],
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.error
    })
}

SuccessfulSubmit.args ={email: "test@test.com"};
SuccessfulSubmit.play = async ({ canvasElement, step }) => {

    await testCase({
        canvasElement,
        step,
        stepMessage: "Submit form with good email",
        link: 'email',
        delay: 1000,
        actionType: ACTION_TYPES.submit,
        type: TEST_TYPES.redirect
    })
}