import ConfirmUpdate from "../../../features/ProfileName/components/ConfirmUpdate";
import { AVAILABLE_LANGUAGES } from "../../../utils/constants";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";

export default {
  title: "GC Sign In/Features/ProfileName/ConfirmUpdate",
  component: ConfirmUpdate,
  decorators: [
    // eslint-disable-next-line no-unused-vars
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
          "Confirmation page for reviewing name changes before updating the profile.",
      },
    },
  },
  argTypes: {
    onConfirm: { action: "confirm clicked" },
    onCancel: { action: "cancel clicked" },
  },
};

const Template = (args) => <ConfirmUpdate {...args} />;

export const Default = Template.bind({});
Default.args = {
  nameFormData: { formatted: "John Doe" },
  errorMessage: "",
  localLoading: false,
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Default confirmation page showing the name change ready to be confirmed.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-name-update",
    routeParams: { language: "en" },
  },
};

export const Loading = Template.bind({});
Loading.args = {
  nameFormData: { formatted: "John Doe" },
  errorMessage: "",
  localLoading: true,
};
Loading.parameters = {
  docs: {
    description: {
      story: "Loading state while the name update is being processed.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-name-update",
    routeParams: { language: "en" },
  },
};

export const WithError = Template.bind({});
WithError.args = {
  nameFormData: { formatted: "John Doe" },
  errorMessage: "Failed to update name. Please try again.",
  localLoading: false,
};
WithError.parameters = {
  docs: {
    description: {
      story: "Error state showing when the name update fails.",
    },
  },
  reactRouter: {
    routePath: "/:language/confirm-name-update",
    routeParams: { language: "en" },
  },
};
