import EditEmailEnterEmail from "../../../features/EmailAddress/EditEmailEnterEmail.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/EmailAddress/EditEmailEnterEmail",
  component: EditEmailEnterEmail,
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
          "Component for entering a new email address during the email update process.",
      },
    },
  },
  argTypes: {
    onSubmit: { action: "submit clicked" },
    onCancel: { action: "cancel clicked" },
    handleFormChange: { action: "form changed" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <EditEmailEnterEmail {...args} />;

// Mock form data
const emptyFormData = {
  emailAddress: "",
};

const filledFormData = {
  emailAddress: "john.doe@example.com",
};

const invalidFormData = {
  emailAddress: "invalid-email",
};

// Story: Default Empty Form
export const Default = Template.bind({});
Default.args = {
  formData: emptyFormData,
  errorMessage: "",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default state of the email entry form with empty email input field.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-email-enter",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Filled Form
export const FilledForm = Template.bind({});
FilledForm.args = {
  formData: filledFormData,
  errorMessage: "",
};
FilledForm.parameters = {
  docs: {
    description: {
      story: "Email entry form with a valid email address already entered.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-email-enter",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  formData: invalidFormData,
  errorMessage: "Please enter a valid email address.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Email entry form displaying an error message for invalid email format.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-email-enter",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  formData: emptyFormData,
  errorMessage: "",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Email entry form displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/edit-email-enter",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
