import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  NAVIGATION_LINKS,
  PAGES,
} from "../../../utils/constants.jsx";
import {
  buildTestCase,
  Template,
  TestTemplate,
} from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Profile Update Name Confirmation Page",
  args: {
    page: PAGES.areYouSureEditYourName,
  },
};

// Basic display stories
export const English = Template.bind({});
English.parameters = buildTestCase.parameters(
  NAVIGATION_LINKS.profileUpdateNameConfirmUpdate,
  { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
  null
);

export const French = Template.bind({});
French.parameters = buildTestCase.parameters(
  NAVIGATION_LINKS.profileUpdateNameConfirmUpdate,
  { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.profile },
  null
);
