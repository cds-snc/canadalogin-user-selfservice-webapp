import OtpVerification from "../../../features/ContactPhoneNumber/components/OtpVerification.jsx";
import { AVAILABLE_LANGUAGES, FLOW_TYPES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/OtpVerification",
  component: OtpVerification,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "OTP verification component for validating one-time passwords sent to the contact phone number via SMS or voice call.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onBack: { action: "back clicked" },
    onChangePhoneForm: { action: "phone form changed" },
    requestNewOtpCode: { action: "new otp code requested" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <OtpVerification {...args} />;

// Mock phone form data
const mockPhoneFormDataSMS = {
  phoneNumber: "+15551234567",
  formattedPhoneNumber: "+1 555-123-4567",
  otpType: FLOW_TYPES.sms,
  otp: "",
  country: "ca",
};

const mockPhoneFormDataVoice = {
  phoneNumber: "+15559876543",
  formattedPhoneNumber: "+1 555-987-6543",
  otpType: FLOW_TYPES.voice,
  otp: "",
  country: "us",
};

const mockPhoneFormDataWithOtp = {
  phoneNumber: "+15551234567",
  formattedPhoneNumber: "+1 555-123-4567",
  otpType: FLOW_TYPES.sms,
  otp: "123456",
  country: "ca",
};

// Story: SMS Verification
export const SMSVerification = Template.bind({});
SMSVerification.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "",
};
SMSVerification.parameters = {
  docs: {
    description: {
      story:
        "OTP verification for SMS delivery. Shows the masked phone number and input field for the 6-digit code.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Voice Call Verification
export const VoiceCallVerification = Template.bind({});
VoiceCallVerification.args = {
  phoneFormData: mockPhoneFormDataVoice,
  errorMessage: "",
};
VoiceCallVerification.parameters = {
  docs: {
    description: {
      story:
        "OTP verification for voice call delivery. Different messaging indicates the code will be spoken over the phone.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: OTP Code Entered
export const WithOtpCode = Template.bind({});
WithOtpCode.args = {
  phoneFormData: mockPhoneFormDataWithOtp,
  errorMessage: "",
};
WithOtpCode.parameters = {
  docs: {
    description: {
      story:
        "OTP verification with a code entered in the input field, ready for validation.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "Invalid verification code. Please try again.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "OTP verification displaying an error message when code validation fails.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/otp-verification-phone",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "",
};
French.parameters = {
  docs: {
    description: {
      story:
        "OTP verification displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/otp-verification-phone",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
