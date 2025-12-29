import PasswordVerification from "../../../features/TransientOtp/components/PasswordVerification.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants.jsx";

export default {
  title: "GC Sign In/Features/TransientOtp/PasswordVerification",
  component: PasswordVerification,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Password verification component for validating the user's current password before proceeding with sensitive operations like password changes or email updates.",
      },
    },
  },
  argTypes: {
    setUserPasswordValue: { action: "password value changed" },
    onCancel: { action: "cancel clicked" },
    validatePassword: { action: "password validated" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <PasswordVerification {...args} />;

// Story: Default Empty Form
export const Default = Template.bind({});
Default.args = {
  userPasswordValue: "",
  errorMessage: "",
  parentPage: "passwordChange",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default password verification form with empty password field and unchecked reveal checkbox.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Password Entered
export const PasswordEntered = Template.bind({});
PasswordEntered.args = {
  userPasswordValue: "mySecurePassword123",
  errorMessage: "",
  parentPage: "passwordChange",
};
PasswordEntered.parameters = {
  docs: {
    description: {
      story:
        "Password verification form with a password entered, ready for validation.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  userPasswordValue: "wrongPassword",
  errorMessage: "Incorrect password. Please try again.",
  parentPage: "passwordChange",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Password verification form displaying an error message when password validation fails.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Email Update Context
export const EmailUpdateContext = Template.bind({});
EmailUpdateContext.args = {
  userPasswordValue: "",
  errorMessage: "",
  parentPage: "emailUpdate",
};
EmailUpdateContext.parameters = {
  docs: {
    description: {
      story:
        "Password verification form in the context of email update process, showing appropriate messaging.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-verification",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  userPasswordValue: "",
  errorMessage: "",
  parentPage: "passwordChange",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Password verification form displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/password-verification",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
