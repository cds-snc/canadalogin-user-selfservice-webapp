import EditLanguagePreferences from "../../../features/LanguagePreference/components/EditLanguagePreferences.jsx";
import {
  AVAILABLE_LANGUAGES,
  PROFILE_LANGUAGES,
} from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/LanguagePreference/EditLanguagePreferences",
  component: EditLanguagePreferences,
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
          "Component for selecting preferred language (English or French) in the user profile preferences.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onLanguageFormChange: { action: "language form changed" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <EditLanguagePreferences {...args} />;

// Mock language form data
const englishFormData = {
  updatedPreferredLanguage: PROFILE_LANGUAGES.en,
};

const frenchFormData = {
  updatedPreferredLanguage: PROFILE_LANGUAGES.fr,
};

const emptyFormData = {
  updatedPreferredLanguage: "",
};

// Story: English Selected
export const EnglishSelected = Template.bind({});
EnglishSelected.args = {
  languageFormData: englishFormData,
  errorMessage: "",
};
EnglishSelected.parameters = {
  docs: {
    description: {
      story:
        "Language preference form with English selected as the preferred language.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-language-preferences",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Selected
export const FrenchSelected = Template.bind({});
FrenchSelected.args = {
  languageFormData: frenchFormData,
  errorMessage: "",
};
FrenchSelected.parameters = {
  docs: {
    description: {
      story:
        "Language preference form with French selected as the preferred language.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-language-preferences",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: No Selection
export const NoSelection = Template.bind({});
NoSelection.args = {
  languageFormData: emptyFormData,
  errorMessage: "",
};
NoSelection.parameters = {
  docs: {
    description: {
      story: "Language preference form with no language selected yet.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-language-preferences",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: With Error Message
export const WithError = Template.bind({});
WithError.args = {
  languageFormData: emptyFormData,
  errorMessage: "Please select a preferred language.",
};
WithError.parameters = {
  docs: {
    description: {
      story:
        "Language preference form displaying an error message when no language is selected.",
    },
  },
  nextjs: {
    router: {
      pathname: "/en/edit-language-preferences",
      query: { language: AVAILABLE_LANGUAGES.en },
    },
  },
};

// Story: French Interface
export const FrenchInterface = Template.bind({});
FrenchInterface.args = {
  languageFormData: frenchFormData,
  errorMessage: "",
};
FrenchInterface.parameters = {
  docs: {
    description: {
      story:
        "Language preference form displayed in French interface, demonstrating internationalization support.",
    },
  },
  nextjs: {
    router: {
      pathname: "/fr/edit-language-preferences",
      query: { language: AVAILABLE_LANGUAGES.fr },
    },
  },
};
