import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { BrowserRouter } from "react-router";
import ProfileYouMayUpdateName from "../../../components/Manage/ProfileYouMayUpdateName.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";

// Mock the navigation hook
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the user hooks
const mockDispatch = vi.fn();
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
  editProfile: null,
  urlLanguageBeforeEdit: null,
  cancelProfileEditing: false,
  relyingPartyInfo: null,
  authenticatedPages: [],
};

vi.mock("../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: mockDispatch,
  }),
}));

// Mock the authService
vi.mock("../../services/authService.jsx", () => ({
  authService: {
    get_my_user_profile: vi.fn(() =>
      Promise.resolve({ data: mockUserState.userProfile })
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

describe("ProfileYouMayUpdateName Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the success page", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    expect(
      screen.getByText(/Your name has been updated to/i)
    ).toBeInTheDocument();
  });

  it("displays the updated name", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    expect(screen.getByText(/Test User/i)).toBeInTheDocument();
  });

  it("shows continue to profile button", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    // Look for the "Back to profile" button by text content since GCDS buttons might not have proper roles
    const backButton = screen.getByText("Back to profile");
    expect(backButton).toBeInTheDocument();
  });

  it("displays information about updating name elsewhere", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    // Look for the exact text that appears in the heading
    expect(
      screen.getByText("You may need to update your name with other places.")
    ).toBeInTheDocument();
  });

  it("shows success notice", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    // Use getAllByText to get all matches, then check one exists
    const successElements = screen.getAllByText((content, element) => {
      return (
        element &&
        element.textContent &&
        element.textContent.includes("Your name has been updated to")
      );
    });
    expect(successElements.length).toBeGreaterThan(0);
    expect(successElements[0]).toBeInTheDocument();
  });

  it("provides information about GC Sign in services", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    // Look for the text about services connected to GC Sign in
    expect(
      screen.getByText(
        "This only changes your name with services connected to your GC Sign in."
      )
    ).toBeInTheDocument();

    // Also check for the GC Account directory link
    expect(screen.getByText("GC Account directory.")).toBeInTheDocument();

    // And the Connected Services link
    expect(screen.getByText("Connected Services")).toBeInTheDocument();
  });

  it("shows both action buttons", () => {
    render(
      <TestWrapper>
        <ProfileYouMayUpdateName />
      </TestWrapper>
    );

    // Check for both buttons by text content since GCDS buttons might not have proper roles
    expect(screen.getByText("Back to profile")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });
});
