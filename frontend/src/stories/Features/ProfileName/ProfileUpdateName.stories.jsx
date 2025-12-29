import ProfileUpdateName from "../../../features/ProfileName/components/ProfileUpdateName.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/ProfileName/ProfileUpdateName",
  component: ProfileUpdateName,
  decorators: [
    (Story) => (
      <UserProvider
        initial={{
          userProfile: {
            id: "test-user-123",
            active: true,
            userName: "testuser@example.com",
            name: {
              givenName: "John",
              familyName: "Doe",
              formatted: "John Doe",
            },
          },
          userData: {
            service: "Test Service",
            language: "en",
            email: "test@example.com",
            emailLanguage: null,
            emailValidated: false,
            trxnId: null,
            passwordSubmitted: false,
            phone: "+15551234567",
            stepVerificationSent: false,
            stepVerified: false,
            viewPrivacy: false,
            id: null,
            otpType: null,
            passwordValidated: false,
          },
          isLoading: false,
          loadingText: null,
          relyingPartyInfo: null,
          authenticatedPages: [],
        }}
      >
        <LanguageProvider language={AVAILABLE_LANGUAGES.en}>
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
          "Form for updating user's first and last name in their profile.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
    onCancel: { action: "cancel clicked" },
    onNameFormChange: { action: "form changed" },
    setErrorCode: { action: "error code set" },
  },
};

const Template = (args) => <ProfileUpdateName {...args} />;

export const Default = Template.bind({});
Default.args = {
  nameFormData: { firstName: "", lastName: "" },
  errorMessage: "",
};
Default.parameters = {
  docs: {
    description: {
      story: "Default empty form for updating profile name.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile/name",
    routeParams: { language: "en" },
  },
};

export const FilledForm = Template.bind({});
FilledForm.args = {
  nameFormData: { firstName: "John", lastName: "Doe" },
  errorMessage: "",
};
FilledForm.parameters = {
  docs: {
    description: {
      story: "Form pre-filled with existing name data.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile/name",
    routeParams: { language: "en" },
  },
};

export const WithError = Template.bind({});
WithError.args = {
  nameFormData: { firstName: "", lastName: "" },
  errorMessage: "First and last name are required.",
};
WithError.parameters = {
  docs: {
    description: {
      story: "Form showing validation error when required fields are missing.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile/name",
    routeParams: { language: "en" },
  },
};
