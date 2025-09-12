import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import ProfileUpdateNameConfirmUpdate from "../../../components/Manage/ProfileUpdateNameConfirmUpdate.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom";

// Mock variables need to be declared first
const mockNavigate = vi.fn();
const mockNavigateHelper = vi.fn();
const mockDispatch = vi.fn();

// Mock the navigation hook
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the navigate helper
vi.mock("../../../hooks/useNavigate.tsx", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock the user hooks
const mockUserState = {
  isLoading: false,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    emailLanguage: null,
    emailValidated: true,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  userProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
  },
  editProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
  },
  urlLanguageBeforeEdit: null,
  cancelProfileEditing: false,
  relyingPartyInfo: null,
  authenticatedPages: [],
};

vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: mockDispatch,
  }),
}));

// Mock the authService
vi.mock("../../../services/authService.jsx", () => ({
  authService: {
    get_my_user_profile: vi.fn(() =>
      Promise.resolve({
        data: {
          id: "test-user-123",
          active: true,
          details: {
            emailVerified: true,
            lastLogin: "2025-09-08T12:00:00Z",
            lastMFA: "2025-09-08T12:00:00Z",
            twoFactorAuthentication: true,
            pwdChangedTime: "2025-09-08T12:00:00Z",
          },
          emails: [{ value: "test@example.com", type: "primary" }],
          phoneNumbers: [{ value: "+1234567890", type: "primary" }],
          meta: {
            created: "2025-09-08T12:00:00Z",
            location: "test",
            lastModified: "2025-09-08T12:00:00Z",
            resourceType: "User",
          },
          userName: "testuser",
          preferredLanguage: "en",
          name: {
            givenName: "Test",
            familyName: "User",
            formatted: "Test User",
          },
        },
      }),
    ),
    update_my_user_profile: vi.fn(() =>
      Promise.resolve({ data: { updated: true } }),
    ),
  },
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider initial={mockUserState}>
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("ProfileUpdateNameConfirmUpdate Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches snapshot", () => {
    const { container } = render(
      <TestWrapper>
        <ProfileUpdateNameConfirmUpdate />
      </TestWrapper>,
    );
    expect(container).toMatchSnapshot();
  });
});
