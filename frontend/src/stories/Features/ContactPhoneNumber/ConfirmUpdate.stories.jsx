import ConfirmUpdate from "../../../features/ContactPhoneNumber/components/ConfirmUpdate";
import { AVAILABLE_LANGUAGES, FLOW_TYPES } from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/ContactPhoneNumber/ConfirmUpdate",
  component: ConfirmUpdate,
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
          "Confirmation page for reviewing and confirming phone number updates before proceeding with OTP verification.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <ConfirmUpdate {...args} />;

// Mock phone form data
const mockPhoneFormDataSMS = {
  phoneNumber: "+15551234567",
  otpType: FLOW_TYPES.sms,
  country: "ca",
};

const mockPhoneFormDataVoice = {
  phoneNumber: "+15559876543",
  otpType: FLOW_TYPES.voice,
  country: "us",
};

// Story: Default SMS Confirmation
export const DefaultSMS = Template.bind({});
DefaultSMS.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "",
  localLoading: false,
};
DefaultSMS.parameters = {
  docs: {
    description: {
      story:
        "Default confirmation page for SMS phone number update. Shows the entered phone number and confirms SMS delivery method.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/confirm-phone-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Voice Confirmation
export const VoiceConfirmation = Template.bind({});
VoiceConfirmation.args = {
  phoneFormData: mockPhoneFormDataVoice,
  errorMessage: "",
  localLoading: false,
};
VoiceConfirmation.parameters = {
  docs: {
    description: {
      story:
        "Confirmation page for voice call phone number update. Shows the entered phone number and confirms voice delivery method.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/confirm-phone-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: Loading State
export const Loading = Template.bind({});
Loading.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "",
  localLoading: true,
};
Loading.parameters = {
  docs: {
    description: {
      story:
        "Confirmation page in loading state while processing the phone number update request.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/confirm-phone-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "Failed to send verification code. Please try again.",
  localLoading: false,
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Confirmation page displaying an error message when the phone number update fails.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/confirm-phone-update",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Language
export const French = Template.bind({});
French.args = {
  phoneFormData: mockPhoneFormDataSMS,
  errorMessage: "",
  localLoading: false,
};
French.parameters = {
  docs: {
    description: {
      story:
        "Phone number update confirmation page displayed in French, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/confirm-phone-update",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
