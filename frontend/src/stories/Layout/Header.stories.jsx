import Header from '../../components/Layout/Header.jsx';
import { UserProvider } from '../../components/Providers/UserProvider.tsx';
import { MemoryRouter } from 'react-router';

// Mock initial state for UserProvider
const mockInitialState = {
  isLoading: false,
  userData: {
    service: 'Test Service',
    language: 'en',
    email: null,
    emailLanguage: null,
    emailValidated: false,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: null,
    otpType: null,
    passwordValidated: false
  },
  userProfile: null,
  editProfile: null,
  urlLanguageBeforeEdit: null,
  cancelProfileEditing: false,
  relyingPartyInfo: {
    icon: 'mock-icon.png',
    id: 'mock-service',
    linkName: 'Mock Service',
    url: 'https://example.com'
  },
  authenticatedPages: [],
};

export default {
  title: 'GC Sign In/Layout/Header',
  component: Header,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <UserProvider initial={mockInitialState}>
          <Story />
        </UserProvider>
      </MemoryRouter>
    ),
  ],
};

export const English = {
  args:{
    currentLang:"en",
    langHref:"/fr"
  }
};

export const French = {
  args:{
    currentLang:"fr",
    langHref:"/en"
  }
};

export const NoLanguage = {
  args:{
    currentLang:"",
    langHref:"/en"
  }
};

