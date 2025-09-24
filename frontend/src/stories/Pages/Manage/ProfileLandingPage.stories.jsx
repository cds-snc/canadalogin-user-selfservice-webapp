import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Profile Landing Page",
  args: {
    page: PAGES.ProfileHome,
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
