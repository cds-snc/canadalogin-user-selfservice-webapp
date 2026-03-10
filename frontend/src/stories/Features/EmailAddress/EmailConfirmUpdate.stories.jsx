import EmailConfirmUpdate from "../../../features/EmailAddress/EmailConfirmUpdate.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";

export default {
  title: "GC Sign In/Features/EmailAddress/EmailConfirmUpdate",
  component: EmailConfirmUpdate,
  decorators: [
    (Story, context) => (
      <UserProvider
        initialState={{
          userProfile: {
            id: "test-user-123",
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            phone: "+15551234567",
          },
          loading: false,
          error: null,
        }}
      >
        <LanguageProvider
          language={context.globals?.language || AVAILABLE_LANGUAGES.en}
        >
          <Story />
        </LanguageProvider>
      </UserProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Confirmation page for reviewing and confirming the new email address before proceeding with the update.",
      },
    },
  },
  argTypes: {
    onSubmit: { action: "submit clicked" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <EmailConfirmUpdate {...args} />;

// Mock form data
const mockFormData = {
  emailAddress: "john.doe@example.com",
};

const mockFormDataLongEmail = {
  emailAddress: "john.doe.with.very.long.email@example-organization.com",
};

// Story: Default Confirmation
export const Default = Template.bind({});
Default.args = {
  formData: mockFormData,
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default confirmation page showing the new email address that will be updated.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-confirm-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Long Email Address
export const LongEmailAddress = Template.bind({});
LongEmailAddress.args = {
  formData: mockFormDataLongEmail,
};
LongEmailAddress.parameters = {
  docs: {
    description: {
      story:
        "Confirmation page with a longer email address to test text wrapping and display.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-confirm-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: No Form Data
export const NoFormData = Template.bind({});
NoFormData.args = {
  formData: {},
};
NoFormData.parameters = {
  docs: {
    description: {
      story:
        "Confirmation page when form data is missing, component returns null and doesn't render.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/email-confirm-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  formData: mockFormData,
};
French.parameters = {
  docs: {
    description: {
      story:
        "Email confirmation page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/email-confirm-update",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
