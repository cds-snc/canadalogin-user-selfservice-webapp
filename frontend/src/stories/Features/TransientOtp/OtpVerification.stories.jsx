import OtpVerification from "../../../features/TransientOtp/components/OtpVerification.jsx";
import { AVAILABLE_LANGUAGES, FLOW_TYPES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/TransientOtp/OtpVerification",
  component: OtpVerification,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "OTP verification component for validating one-time passwords sent via SMS, voice call, or email.",
      },
    },
  },
  argTypes: {
    setUserOtpValue: { action: "otp value changed" },
    onBack: { action: "back clicked" },
    requestOtpCode: { action: "otp code requested" },
    validateOtpCode: { action: "otp code validated" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <OtpVerification {...args} />;

// Mock user profile and factors for stories
const mockUserProfile = {
  id: "test-user-123",
  email: "test@example.com",
  firstName: "John",
  lastName: "Doe",
};

const mockSMSFactor = {
  id: "factor-1",
  type: FLOW_TYPES.sms,
  phoneNumber: "+15551234567",
  status: "active",
};

const mockVoiceFactor = {
  id: "factor-2",
  type: FLOW_TYPES.voice,
  phoneNumber: "+15559876543",
  status: "active",
};

const mockEmailFactor = {
  id: "factor-3",
  type: FLOW_TYPES.email,
  phoneNumber: "test@example.com", // Email uses phoneNumber field for consistency
  status: "active",
};

// Story: SMS Verification
export const SMSVerification = Template.bind({});
SMSVerification.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockSMSFactor,
  userOtpValue: "",
  errorMessage: "",
};
SMSVerification.parameters = {
  docs: {
    description: {
      story:
        "Shows OTP verification for SMS text message delivery. Displays the masked phone number and provides input for 6-digit code.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Voice Call Verification
export const VoiceCallVerification = Template.bind({});
VoiceCallVerification.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockVoiceFactor,
  userOtpValue: "",
  errorMessage: "",
};
VoiceCallVerification.parameters = {
  docs: {
    description: {
      story:
        "Shows OTP verification for voice call delivery. Different messaging indicates the code will be spoken over the phone.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Email Verification
export const EmailVerification = Template.bind({});
EmailVerification.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockEmailFactor,
  userOtpValue: "",
  errorMessage: "",
};
EmailVerification.parameters = {
  docs: {
    description: {
      story:
        "Shows OTP verification for email delivery. Displays different heading and instructions for email-based verification.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Partial Input
export const PartialInput = Template.bind({});
PartialInput.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockSMSFactor,
  userOtpValue: "123",
  errorMessage: "",
};
PartialInput.parameters = {
  docs: {
    description: {
      story:
        "Shows verification form with partial OTP input. Continue button remains disabled until 6 digits are entered.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Complete Input Ready
export const CompleteInput = Template.bind({});
CompleteInput.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockSMSFactor,
  userOtpValue: "123456",
  errorMessage: "",
};
CompleteInput.parameters = {
  docs: {
    description: {
      story:
        "Shows verification form with complete 6-digit OTP input. Continue button is enabled and ready for submission.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Validation Error
export const WithError = Template.bind({});
WithError.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockSMSFactor,
  userOtpValue: "123456",
  errorMessage: "Invalid verification code. Please try again.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Shows error state when an invalid OTP code is entered. Error message appears below the input field.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language Support
export const FrenchLanguage = Template.bind({});
FrenchLanguage.args = {
  userProfile: mockUserProfile,
  userSelectedMfaFactor: mockSMSFactor,
  userOtpValue: "",
  errorMessage: "",
};
FrenchLanguage.parameters = {
  docs: {
    description: {
      story:
        "Shows OTP verification component with French language content and instructions.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/otp-verification",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
