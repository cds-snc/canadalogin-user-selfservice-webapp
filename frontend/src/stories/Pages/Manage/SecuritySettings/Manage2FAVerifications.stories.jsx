import Manage2FAVerifications from "../../../../components/Manage/SecuritySettings/Manage2FAVerifications.jsx";
import {
  AVAILABLE_LANGUAGES,
  FLOW_TYPES,
  PAGES,
  SUBMIT_END_POINTS,
} from "../../../../utils/constants.jsx";
import { buildTestCase, Template } from "../../../Tests/utils/functions.tsx";

export default {
  title: "GC Sign In/Pages/Manage/Security Settings/Manage 2FA Verifications",
  component: Manage2FAVerifications,
  args: {
    page: PAGES.manage2FAVerifications,
  },
  parameters: {
    docs: {
      description: {
        component: `
# Manage 2FA Verifications Component

This component displays and manages two-factor authentication (2FA) verification methods for phone numbers. It shows:

- Available phone numbers with 2FA enabled
- Available methods for each number (SMS and/or Voice OTP)
- Options to remove phone numbers (when multiple are available)
- Add new phone number functionality

## Features
- Fetches user's OTP phone factors from API
- Displays phone numbers with available verification methods
- Shows loading state while fetching data
- Redirects to security settings if no phone factors found
- Allows removal of phone numbers when multiple exist
        `,
      },
    },
  },
};

// MSW Mock responses
const createOtpFactorsResponse = (factors) => ({
  success: true,
  data: factors,
  message: "OTP factors retrieved successfully",
});

const createMswMock = (userId, response) => ({
  type: "get",
  endpoint: `${SUBMIT_END_POINTS.users}/${userId}/otp_factors`,
  response,
});

// MSW Mocks for different scenarios
const MSW_MOCKS = {
  singlePhoneSMS: createMswMock(
    "test-user-123",
    createOtpFactorsResponse([
      {
        id: "factor-sms-1",
        phoneNumber: "5551234567",
        type: "smsotp",
      },
    ]),
  ),
  singlePhoneBoth: createMswMock(
    "test-user-123",
    createOtpFactorsResponse([
      {
        id: "factor-sms-1",
        phoneNumber: "5551234567",
        type: "smsotp",
      },
      {
        id: "factor-voice-1",
        phoneNumber: "5551234567",
        type: "voiceotp",
      },
    ]),
  ),
  multiplePhones: createMswMock(
    "test-user-123",
    createOtpFactorsResponse([
      {
        id: "factor-sms-1",
        phoneNumber: "5551234567",
        type: "smsotp",
      },
      {
        id: "factor-voice-1",
        phoneNumber: "5551234567",
        type: "voiceotp",
      },
      {
        id: "factor-sms-2",
        phoneNumber: "5559876543",
        type: "smsotp",
      },
    ]),
  ),
};

export const SinglePhoneSMSOnly = Template.bind({});
SinglePhoneSMSOnly.parameters = buildTestCase.parameters(
  "",
  {
    language: AVAILABLE_LANGUAGES.en,
    flow: FLOW_TYPES.manage,
  },
  [MSW_MOCKS.singlePhoneSMS],
);

export const SinglePhoneBothMethods = Template.bind({});
SinglePhoneBothMethods.parameters = buildTestCase.parameters(
  "",
  {
    language: AVAILABLE_LANGUAGES.en,
    flow: FLOW_TYPES.manage,
  },
  [MSW_MOCKS.singlePhoneBoth],
);

export const MultiplePhones = Template.bind({});
MultiplePhones.parameters = buildTestCase.parameters(
  "",
  {
    language: AVAILABLE_LANGUAGES.en,
    flow: FLOW_TYPES.manage,
  },
  [MSW_MOCKS.multiplePhones],
);

export const French = Template.bind({});
French.parameters = buildTestCase.parameters(
  "",
  {
    language: AVAILABLE_LANGUAGES.fr,
    flow: FLOW_TYPES.manage,
  },
  [MSW_MOCKS.singlePhoneBoth],
);

export const EmptyState = Template.bind({});
EmptyState.parameters = {
  ...buildTestCase.parameters(
    "",
    {
      language: AVAILABLE_LANGUAGES.en,
      flow: FLOW_TYPES.manage,
    },
    [createMswMock("test-user-123", createOtpFactorsResponse([]))],
  ),
  docs: {
    description: {
      story:
        "Shows what happens when no phone factors are found - should redirect to security settings.",
    },
  },
};
