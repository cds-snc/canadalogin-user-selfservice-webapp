import ViewProfileNameCard from "../../../features/ProfileName/components/ViewProfileNameCard.jsx";
import { AVAILABLE_LANGUAGES, PAGES } from "../../../utils/constants";
import { getPageContent } from "../../../utils/functions";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

export default {
  title: "GC Sign In/Features/ProfileName/ViewProfileNameCard",
  component: ViewProfileNameCard,
  decorators: [
    (Story, context) => {
      // Get the story name to determine which user to show
      const storyName = context.name || "";

      let userProfile;
      if (storyName.includes("LongNames")) {
        userProfile = {
          id: "test-user-123",
          active: true,
          userName: "testuser@example.com",
          name: {
            givenName: "Jean-Baptiste",
            familyName: "Poquelin-Molière",
            formatted: "Jean-Baptiste Poquelin-Molière",
          },
        };
      } else {
        userProfile = {
          id: "test-user-123",
          active: true,
          userName: "testuser@example.com",
          name: {
            givenName: "John",
            familyName: "Doe",
            formatted: "John Doe",
          },
        };
      }

      return (
        <UserProvider
          initial={{
            userProfile: userProfile,
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
      );
    },
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Card component for displaying user's profile name with edit functionality.",
      },
    },
  },
};

const Template = ({ language = "en" }) => {
  // Get page content using the actual function like the real component would
  const pageContent = getPageContent(language, PAGES.ProfileHome);
  return <ViewProfileNameCard pageContent={pageContent} />;
};

export const Default = Template.bind({});
Default.args = {
  language: "en",
};
Default.parameters = {
  docs: {
    description: {
      story:
        "Profile name card showing standard length names with edit functionality.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile",
    routeParams: { language: "en" },
  },
};

export const LongNames = Template.bind({});
LongNames.args = {
  language: "en",
};
LongNames.parameters = {
  docs: {
    description: {
      story:
        "Profile name card showing how it handles longer names gracefully.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile",
    routeParams: { language: "en" },
  },
};
