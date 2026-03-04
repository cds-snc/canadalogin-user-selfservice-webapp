import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/EmailAddress/EditEmailAddressPage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Main container component for the email address editing flow. Manages the multi-step process including password verification, OTP selection, OTP verification, email entry, email OTP validation, confirmation, and success pages.",
      },
    },
  },
  args: {
    page: PAGES.editEmailPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    firstName: "John",
    lastName: "Doe",
    password: "TestPassword123!",
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
      endpoint: "/v1/users/otp_factors",
      response: {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            destination: "+15551234567",
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
    {
      type: "post",
      endpoint: "/v1/otp/transient/send",
      response: {
        success: true,
        data: { trxnId: "txn-123" },
      },
    },
    {
      type: "post",
      endpoint: "/v1/otp/transient/verify",
      response: {
        success: true,
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
      endpoint: "/v1/users/otp_factors",
      response: {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            destination: "+15551234567",
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
    {
      type: "post",
      endpoint: "/v1/otp/transient/send",
      response: {
        success: true,
        data: { trxnId: "txn-123" },
      },
    },
    {
      type: "post",
      endpoint: "/v1/otp/transient/verify",
      response: {
        success: true,
      },
    },
  ],
);
