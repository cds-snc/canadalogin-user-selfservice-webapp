import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  NAVIGATION_LINKS,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Are You Sure Update ContactNumber Page",
  args: {
    page: PAGES.areYouSureUpdateContactNumber,
  },
};

export const English = Template.bind({});
English.parameters = buildTestCase.parameters(
  NAVIGATION_LINKS.areYouSureUpdateContactNumber,
  { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
  null,
);

export const French = Template.bind({});
French.parameters = buildTestCase.parameters(
  NAVIGATION_LINKS.areYouSureUpdateContactNumber,
  { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.profile },
  null,
);
