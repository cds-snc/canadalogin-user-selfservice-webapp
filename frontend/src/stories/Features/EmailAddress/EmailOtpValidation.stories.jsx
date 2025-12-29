import EmailOtpValidation from "../../../features/EmailAddress/EmailOtpValidation.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants.jsx";

export default {
  title: "GC Sign In/Features/EmailAddress/EmailOtpValidation",
  component: EmailOtpValidation,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "OTP validation component for verifying one-time passwords sent to the email address during email update process.",
      },
    },
  },
  argTypes: {
    onSubmit: { action: "submit clicked" },
    onCancel: { action: "cancel clicked" },
    onBack: { action: "back clicked" },
    setFormData: { action: "form data set" },
    handleChange: { action: "otp input changed" },
    requestOtpCode: { action: "otp code requested" },
  },
};

const Template = (args) => <EmailOtpValidation {...args} />;

// Mock form data
const mockFormData = {
  emailAddress: "john.doe@example.com",
};

// Story: Default OTP Validation
export const Default = Template.bind({});
Default.args = {
  formData: mockFormData,
  userOtpValue: "",
  errorMessage: "",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default OTP validation page showing email address and empty OTP input field.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-otp-validation",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: OTP Code Entered
export const WithOtpCode = Template.bind({});
WithOtpCode.args = {
  formData: mockFormData,
  userOtpValue: "123456",
  errorMessage: "",
};
WithOtpCode.parameters = {
  docs: {
    description: {
      story:
        "OTP validation page with a 6-digit code entered, ready for verification.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-otp-validation",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  formData: mockFormData,
  userOtpValue: "123456",
  errorMessage: "Invalid verification code. Please try again.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "OTP validation page displaying an error message when code verification fails.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-otp-validation",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Partial OTP Code
export const PartialOtpCode = Template.bind({});
PartialOtpCode.args = {
  formData: mockFormData,
  userOtpValue: "123",
  errorMessage: "",
};
PartialOtpCode.parameters = {
  docs: {
    description: {
      story: "OTP validation page with a partially entered verification code.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-otp-validation",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  formData: mockFormData,
  userOtpValue: "",
  errorMessage: "",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Email OTP validation page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/email-otp-validation",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
