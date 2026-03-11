import Password from "../../../features/ChangePassword/components/Password";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/ChangePassword/Password",
  component: Password,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Password update component for changing user passwords. Includes password strength validation and policy requirements.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    setErrorCode: { action: "error code set" },
    setLocalLoading: { action: "loading state changed" },
  },
};

const Template = (args) => <Password {...args} />;

// Mock OTP sent response
const mockOtpSentResponse = {
  success: true,
  message: "OTP sent successfully",
  factorId: "factor-123",
};

// Story: Default Password Form
export const Default = Template.bind({});
Default.args = {
  otpSentResponse: null,
  userOtpValue: "",
  errorMessage: "",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default state of the password update form. Shows password input, policy requirements, and confirmation checkbox.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  otpSentResponse: null,
  userOtpValue: "",
  errorMessage: "Password does not meet policy requirements.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Password form displaying an error message when validation fails or other issues occur.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: OTP Code Entered
export const WithOtpCode = Template.bind({});
WithOtpCode.args = {
  otpSentResponse: mockOtpSentResponse,
  userOtpValue: "123456",
  errorMessage: "",
};
WithOtpCode.parameters = {
  docs: {
    description: {
      story:
        "Password form with OTP code entered. Shows the state after OTP verification is completed.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  otpSentResponse: null,
  userOtpValue: "",
  errorMessage: "",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Password form displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/password-update",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
