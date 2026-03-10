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
  title:
    "GC Sign In/Features/MFAPhoneNumber/DeleteMFAPhoneNumber/DeleteMFAPage",
  component: TestTemplate,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "DeleteMFAPage container component for deleting MFA phone number. Manages the multi-step flow including confirmation and verification.",
      },
    },
  },
  args: {
    page: PAGES.deleteMFAPage,
    email: "test@example.com",
    phone: "+15551234567",
    id: "test-user-123",
    otpType: FLOW_TYPES.sms,
    passwordValidated: false,
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
        type: "delete",
        endpoint: "/v1/users/test-user-123/otp_factors/factor-1",
        response: {
          success: true,
          data: { message: "OTP factor deleted successfully" },
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
        state: {
          factorIds: ["factor-1"],
        },
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
        type: "delete",
        endpoint: "/v1/users/test-user-123/otp_factors/factor-1",
        response: {
          success: true,
          data: { message: "OTP factor deleted successfully" },
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
        state: {
          factorIds: ["factor-1"],
        },
      },
    },
  };
})();
