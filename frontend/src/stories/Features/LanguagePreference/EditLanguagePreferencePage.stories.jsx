import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/LanguagePreference/EditLanguagePreferencePage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
  },
  args: {
    page: PAGES.editLanguagePreferencePage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
  },
};

export const Default = TestTemplate.bind({});
Default.args = {};
Default.parameters = buildTestCase.parameters(
  "",
  { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
  [
    {
      type: "post",
      endpoint: "/v1/auth/password/verify",
      response: {
        success: true,
        data: [],
      },
    },
    {
      type: "get",
      endpoint: "/v1/auth/password/policy",
      response: {
        success: true,
        data: { pwdMinLength: 12, pwdMaxLength: 65 },
      },
    },
  ],
);

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = buildTestCase.parameters(
  "",
  { language: AVAILABLE_LANGUAGES.fr, flow: FLOW_TYPES.profile },
  [
    {
      type: "post",
      endpoint: "/v1/auth/password/verify",
      response: {
        success: true,
        data: [],
      },
    },
    {
      type: "get",
      endpoint: "/v1/auth/password/policy",
      response: {
        success: true,
        data: { pwdMinLength: 12, pwdMaxLength: 65 },
      },
    },
  ],
);
