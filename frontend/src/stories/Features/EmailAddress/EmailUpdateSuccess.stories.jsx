import EmailUpdateSuccess from "../../../features/EmailAddress/EmailUpdateSuccess.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants.jsx";

export default {
  title: "GC Sign In/Features/EmailAddress/EmailUpdateSuccess",
  component: EmailUpdateSuccess,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Success page displayed after email address has been successfully updated, with information about next steps and sign-in changes.",
      },
    },
  },
  argTypes: {
    onBackToProfile: { action: "back to profile clicked" },
    onSignOut: { action: "sign out clicked" },
  },
};

const Template = (args) => <EmailUpdateSuccess {...args} />;

// Story: Default Success State
export const Default = Template.bind({});
Default.args = {
  newEmailAddress: "john.doe@example.com",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default success page showing the new email address and next steps after successful update.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-update-success",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Long Email Address
export const LongEmailAddress = Template.bind({});
LongEmailAddress.args = {
  newEmailAddress: "john.doe.with.very.long.email@example-organization.com",
};
LongEmailAddress.parameters = {
  docs: {
    description: {
      story:
        "Success page with a longer email address to test text wrapping and display formatting.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-update-success",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Without Email Address
export const WithoutEmailAddress = Template.bind({});
WithoutEmailAddress.args = {
  newEmailAddress: "",
};
WithoutEmailAddress.parameters = {
  docs: {
    description: {
      story:
        "Success page when email address is missing or empty, showing fallback content.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-update-success",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  newEmailAddress: "jean.dupont@exemple.com",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Email update success page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/email-update-success",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
