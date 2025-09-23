import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Profile Update Name Success Page",
  args: {
    page: PAGES.profileUpdateNameSuccess,
  },
};

export const English = Template.bind({});
English.parameters = buildTestCase.parameters(
  "",
  { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
  null,
);

export const French = Template.bind({});
French.parameters = buildTestCase.parameters(
  "",
  { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.profile },
  null,
);
