import EnterPhoneNumber from "../../../features/ContactPhoneNumber/components/EnterPhoneNumber.jsx";
import { AVAILABLE_LANGUAGES, FLOW_TYPES } from "../../../utils/constants.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/EnterPhoneNumber",
  component: EnterPhoneNumber,
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
          "Component for entering a new phone number with international country selection and OTP delivery method choice (SMS or voice).",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onChangePhoneForm: { action: "phone form changed" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <EnterPhoneNumber {...args} />;

// Mock phone form data
const defaultPhoneFormData = {
  phoneNumber: "",
  otpType: FLOW_TYPES.sms,
  country: "ca",
};

const filledPhoneFormData = {
  phoneNumber: "+15551234567",
  otpType: FLOW_TYPES.sms,
  country: "ca",
};

const voicePhoneFormData = {
  phoneNumber: "+15551234567",
  otpType: FLOW_TYPES.voice,
  country: "ca",
};

// Story: Default Empty Form
export const Default = Template.bind({});
Default.args = {
  phoneFormData: defaultPhoneFormData,
  errorMessage: "",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default state of the phone number entry form. Shows empty phone input with SMS selected as default OTP method.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/enter-phone-number",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Filled Form with SMS
export const FilledFormSMS = Template.bind({});
FilledFormSMS.args = {
  phoneFormData: filledPhoneFormData,
  errorMessage: "",
};
FilledFormSMS.parameters = {
  docs: {
    description: {
      story:
        "Phone number form with a valid phone number entered and SMS delivery method selected.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/enter-phone-number",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Filled Form with Voice
export const FilledFormVoice = Template.bind({});
FilledFormVoice.args = {
  phoneFormData: voicePhoneFormData,
  errorMessage: "",
};
FilledFormVoice.parameters = {
  docs: {
    description: {
      story:
        "Phone number form with a valid phone number entered and voice call delivery method selected.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/enter-phone-number",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  phoneFormData: {
    phoneNumber: "123",
    otpType: FLOW_TYPES.sms,
    country: "ca",
  },
  errorMessage: "Please enter a valid phone number.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Phone number form displaying an error message for invalid phone number input.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/enter-phone-number",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  phoneFormData: defaultPhoneFormData,
  errorMessage: "",
};
French.parameters = {
  docs: {
    description: {
      story:
        "Phone number entry form displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/enter-phone-number",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
