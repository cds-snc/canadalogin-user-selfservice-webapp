import ConfirmUpdate from "../../../features/LanguagePreference/components/ConfirmUpdate.jsx";
import {
  AVAILABLE_LANGUAGES,
  PROFILE_LANGUAGES,
} from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/LanguagePreference/ConfirmUpdate",
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
          "Confirmation page for reviewing the selected language preference before updating the profile.",
      },
    },
  },
  argTypes: {
    onConfirm: { action: "confirm clicked" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <ConfirmUpdate {...args} />;

const englishFormData = {
  languageCode: PROFILE_LANGUAGES.en,
  updatedPreferredLanguage: PROFILE_LANGUAGES.en,
};

const frenchFormData = {
  languageCode: PROFILE_LANGUAGES.fr,
  updatedPreferredLanguage: PROFILE_LANGUAGES.fr,
};

export const EnglishConfirmation = Template.bind({});
EnglishConfirmation.args = {
  languageFormData: englishFormData,
  errorMessage: "",
  localLoading: false,
};
EnglishConfirmation.parameters = {
  docs: {
    description: {
      story:
        "Language preference confirmation with English selected as the preferred language.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-language-update",
    routeParams: { language: "en" },
  },
};

export const FrenchConfirmation = Template.bind({});
FrenchConfirmation.args = {
  languageFormData: frenchFormData,
  errorMessage: "",
  localLoading: false,
};
FrenchConfirmation.parameters = {
  docs: {
    description: {
      story:
        "Language preference confirmation with French selected as the preferred language.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-language-update",
    routeParams: { language: "fr" },
  },
};
export const Loading = Template.bind({});
Loading.args = {
  languageFormData: englishFormData,
  errorMessage: "",
  localLoading: true,
};
Loading.parameters = {
  docs: {
    description: {
      story:
        "Language preference confirmation in loading state while the update is being processed.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-language-update",
    routeParams: { language: "en" },
  },
};

export const WithError = Template.bind({});
WithError.args = {
  languageFormData: englishFormData,
  errorMessage: "Failed to update language preference. Please try again.",
  localLoading: false,
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Language preference confirmation displaying an error message when the update fails.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-language-update",
    routeParams: { language: "en" },
  },
};
