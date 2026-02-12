import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../../utils/constants";
import {
  buildTestCase,
  TestTemplate,
} from "../../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/MFAPhoneNumber/AddMFAPhoneNumber/AddMFAPage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "AddMFAPage container component for adding MFA phone number. Manages the multi-step flow including password verification, OTP selection, phone number entry, OTP verification, and confirmation.",
      },
    },
  },
  args: {
    page: PAGES.addMFAPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
    otpType: FLOW_TYPES.sms,
    passwordValidated: false,
  },
};

export const Default = TestTemplate.bind({});
Default.args = {};
Default.parameters = buildTestCase.parameters(
  "",
  { language: AVAILABLE_LANGUAGES.en, flow: FLOW_TYPES.profile },
  [
    {
      type: "get",
      endpoint: "/v1/users/test-user-123/otp_factors",
      response: {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            status: "active",
          },
        ],
      },
    },
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
      type: "get",
      endpoint: "/v1/users/test-user-123/otp_factors",
      response: {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            status: "active",
          },
        ],
      },
    },
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
