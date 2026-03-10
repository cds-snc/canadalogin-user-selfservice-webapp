import PasswordChangedConfirmation from "../../../features/ChangePassword/components/PasswordChangedConfirmation.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";

export default {
  title: "GC Sign In/Features/ChangePassword/PasswordChangedConfirmation",
  component: PasswordChangedConfirmation,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Confirmation page displayed after a successful password change. Shows success message and countdown timer.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
  },
};

const Template = (args) => <PasswordChangedConfirmation {...args} />;

// Story: Default Success State
export const Default = Template.bind({});
Default.args = {};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default confirmation page shown after successful password change. Includes success message and countdown timer.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/password-changed-confirmation",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {};
French.parameters = {
  docs: {
    description: {
      story:
        "Password change confirmation page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/password-changed-confirmation",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
