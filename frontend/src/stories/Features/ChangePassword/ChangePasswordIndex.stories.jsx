import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../utils/constants";
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
        endpoint: `${SUBMIT_END_POINTS.passwordVerify}`,
        response: {
          success: true,
          data: [],
        },
      },
      {
        type: "get",
        endpoint: `${SUBMIT_END_POINTS.requestPasswordPolicy}`,
        response: {
          success: true,
          data: { pwdMinLength: 12, pwdMaxLength: 65 },
        },
      },
      {
        type: "post",
        endpoint: `${SUBMIT_END_POINTS.passwordUpdate}`,
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
        endpoint: `${SUBMIT_END_POINTS.passwordVerify}`,
        response: {
          success: true,
          data: [],
        },
      },
      {
        type: "get",
        endpoint: `${SUBMIT_END_POINTS.requestPasswordPolicy}`,
        response: {
          success: true,
          data: { pwdMinLength: 12, pwdMaxLength: 65 },
        },
      },
      {
        type: "post",
        endpoint: `${SUBMIT_END_POINTS.passwordUpdate}`,
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
  };
})();
