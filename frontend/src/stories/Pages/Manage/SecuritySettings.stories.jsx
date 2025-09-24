import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, Template } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Security Settings Landing Page",
  args: {
    page: PAGES.securitySettings,
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
