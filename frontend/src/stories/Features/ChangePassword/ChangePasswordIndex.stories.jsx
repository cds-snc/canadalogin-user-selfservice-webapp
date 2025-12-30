import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
} from "../../../utils/constants.jsx";
import { buildTestCase, TestTemplate } from "../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Features/ChangePassword/ChangePasswordIndex",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "ChangePasswordIndex container component for changing user password. Manages the multi-step flow including password verification, OTP selection, OTP verification, password update, and confirmation.",
      },
    },
  },
  args: {
    page: PAGES.password, // The main page for password change flow
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
Default.parameters = (() => {
  const baseParams = buildTestCase.parameters(
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
      {
        type: "post",
        endpoint: "/v1/auth/password/update",
        response: {
          success: true,
          data: { message: "Password updated successfully" },
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

  return {
    ...baseParams,
    reactRouter: {
      ...baseParams.reactRouter,
      location: {
        ...baseParams.reactRouter.location,
        pathname: "/en/update-password",
        state: {},
      },
    },
  };
})();

export const French = TestTemplate.bind({});
French.args = {};
French.parameters = (() => {
  const baseParams = buildTestCase.parameters(
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
      {
        type: "post",
        endpoint: "/v1/auth/password/update",
        response: {
          success: true,
          data: { message: "Password updated successfully" },
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

  return {
    ...baseParams,
    reactRouter: {
      ...baseParams.reactRouter,
      location: {
        ...baseParams.reactRouter.location,
        pathname: "/fr/update-password",
        state: {},
      },
    },
  };
})();
