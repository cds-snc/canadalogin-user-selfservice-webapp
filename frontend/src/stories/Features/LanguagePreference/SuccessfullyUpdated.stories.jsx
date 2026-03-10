import SuccessfullyUpdated from "../../../features/LanguagePreference/components/SuccessfullyUpdated.jsx";
import {
  AVAILABLE_LANGUAGES,
  PROFILE_LANGUAGES,
} from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";

export default {
  title: "GC Sign In/Features/LanguagePreference/SuccessfullyUpdated",
  component: SuccessfullyUpdated,
  parameters: {
    layout: "fullscreen",
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
  },
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
            preferredLanguage: "en",
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
};

const Template = (args) => <SuccessfullyUpdated {...args} />;

export const EnglishUpdated = Template.bind({});
EnglishUpdated.args = {
  languageFormData: {
    languageCode: PROFILE_LANGUAGES.en,
    updatedPreferredLanguage: PROFILE_LANGUAGES.en,
  },
};
EnglishUpdated.parameters = {
  docs: {
    description: {
      story: "Success page after updating language preference to English.",
    },
  },
  reactRouter: {
    routePath: "/:language/language-updated",
    routeParams: { language: "en" },
  },
};

export const FrenchUpdated = Template.bind({});
FrenchUpdated.args = {
  languageFormData: {
    languageCode: PROFILE_LANGUAGES.fr,
    updatedPreferredLanguage: PROFILE_LANGUAGES.fr,
  },
};
FrenchUpdated.parameters = {
  docs: {
    description: {
      story: "Success page after updating language preference to French.",
    },
  },
  reactRouter: {
    routePath: "/:language/language-updated",
    routeParams: { language: "fr" },
  },
};
