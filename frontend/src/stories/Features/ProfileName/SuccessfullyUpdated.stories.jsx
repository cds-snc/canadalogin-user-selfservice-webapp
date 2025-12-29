import SuccessfullyUpdated from "../../../features/ProfileName/components/SuccessfullyUpdated.jsx";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/ProfileName/SuccessfullyUpdated",
  component: SuccessfullyUpdated,
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
          "Success page shown after successfully updating the user's profile name.",
      },
    },
  },
  argTypes: {
    onNext: { action: "next clicked" },
  },
};

const Template = (args) => <SuccessfullyUpdated {...args} />;

export const Default = Template.bind({});
Default.args = {
  nameFormData: { formatted: "John Doe" },
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Success page showing confirmation that the profile name has been updated successfully.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile/name/success",
    routeParams: { language: "en" },
  },
};
