import ViewLanguagePreferences from "../../../features/LanguagePreference/components/ViewLanguagePreference.jsx";
import {
  AVAILABLE_LANGUAGES,
  PROFILE_LANGUAGES,
  PAGES,
  LANGUAGE_DISPLAY_NAMES,
} from "../../../utils/constants";
import { getPageContent } from "../../../utils/functions";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import { useUser } from "../../../components/Providers/useUser";

// Create a wrapper component that provides the proper context
const ViewLanguagePreferencesWrapper = ({
  language,
  storyPreferredLanguage,
}) => {
  // Get page content using the actual function
  const pageContent = getPageContent(language, PAGES.ProfileHome);

  const initialState = {
    userProfile: {
      id: "test-user-123",
      active: true,
      userName: "testuser@example.com",
      preferredLanguage: storyPreferredLanguage,
      name: {
        givenName: "John",
        familyName: "Doe",
        formatted: "John Doe",
      },
    },
    userData: {
      service: "Test Service",
      language: language,
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
  };

  // Create a simplified version that doesn't need useParams
  const ViewLanguagePreferencesWithLanguage = ({ pageContent }) => {
    const { state } = useUser();
    const preferredLanguage = state?.userProfile?.preferredLanguage || "";

    const displayName = LANGUAGE_DISPLAY_NAMES[language][preferredLanguage];
    const editLabel = pageContent["5"] || "Edit";
    const editHref = `/${language}/profile/update-language`;

    return (
      <>
        <h3 style={{ marginTop: "300px" }}>{pageContent["13"]}</h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          <div>{displayName}</div>
          <a
            href={editHref}
            onClick={(ev) => {
              ev.preventDefault();
            }}
          >
            {editLabel}
          </a>
        </div>
      </>
    );
  };

  return (
    <UserProvider initial={initialState}>
      <LanguageProvider language={language}>
        <ViewLanguagePreferencesWithLanguage pageContent={pageContent} />
      </LanguageProvider>
    </UserProvider>
  );
};

export default {
  title: "GC Sign In/Features/LanguagePreference/ViewLanguagePreference",
  component: ViewLanguagePreferences,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "View component for displaying the current language preference with an edit option.",
      },
    },
  },
};

const Template = ({ language, storyPreferredLanguage }) => {
  return (
    <ViewLanguagePreferencesWrapper
      language={language}
      storyPreferredLanguage={storyPreferredLanguage}
    />
  );
};

export const EnglishPreference = Template.bind({});
EnglishPreference.args = {
  language: "en",
  storyPreferredLanguage: PROFILE_LANGUAGES.en,
};
EnglishPreference.parameters = {
  docs: {
    description: {
      story:
        "View language preference component showing English as the preferred language. Should display 'English' as the language name.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile",
    routeParams: { language: "en" },
  },
};

export const FrenchPreference = Template.bind({});
FrenchPreference.args = {
  language: "fr",
  storyPreferredLanguage: PROFILE_LANGUAGES.fr,
};
FrenchPreference.parameters = {
  docs: {
    description: {
      story:
        "View language preference component showing French as the preferred language. Should display 'Français' as the language name.",
    },
  },
  reactRouter: {
    routePath: "/:language/profile",
    routeParams: { language: "fr" },
  },
};
