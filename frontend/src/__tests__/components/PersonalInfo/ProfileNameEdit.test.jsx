import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import ProfileNameEdit from "../../../components/PersonalInfo/ProfileNameEdit.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { useUser } from "../../../components/Providers/useUser.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom/vitest";

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Mock authService
vi.mock("../../../services/authService.jsx", () => ({
  get_my_user_profile: vi.fn().mockResolvedValue({
    active: true,
    id: "test-user-123",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
    emails: [{ type: "primary", value: "test@example.com" }],
    phoneNumbers: [{ type: "primary", value: "+1234567890" }],
    preferredLanguage: "en",
    details: {
      emailVerified: true,
      twoFactorAuthentication: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    meta: {
      created: "2025-09-08T12:00:00Z",
      lastModified: "2025-09-08T12:00:00Z",
      location: "test",
      resourceType: "User",
    },
  }),
  updateUser: vi.fn().mockResolvedValue({ success: true }),
}));

// Mock the navigate helper
const mockNavigateHelper = vi.fn();
vi.mock("../../../hooks/useNavigate.tsx", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

const mockUserState = {
  isLoading: false,
  userProfile: {
    active: true,
    id: "test-user-123",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
    emails: [{ type: "primary", value: "test@example.com" }],
    phoneNumbers: [{ type: "primary", value: "+1234567890" }],
    preferredLanguage: "en",
    details: {
      emailVerified: true,
      twoFactorAuthentication: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    meta: {
      created: "2025-09-08T12:00:00Z",
      lastModified: "2025-09-08T12:00:00Z",
      location: "test",
      resourceType: "User",
    },
  },
  editProfile: {
    active: true,
    id: "test-user-123",
    name: {
      givenName: "Test",
      familyName: "User",
      formatted: "Test User",
    },
    emails: [{ type: "primary", value: "test@example.com" }],
    phoneNumbers: [{ type: "primary", value: "+1234567890" }],
    preferredLanguage: "en",
    details: {
      emailVerified: true,
      twoFactorAuthentication: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    meta: {
      created: "2025-09-08T12:00:00Z",
      lastModified: "2025-09-08T12:00:00Z",
      location: "test",
      resourceType: "User",
    },
  },
  userData: {
    language: "en",
    email: null,
    emailLanguage: null,
    emailValidated: false,
    id: null,
    otpType: undefined,
    passwordSubmitted: false,
    passwordValidated: false,
    phone: undefined,
    service: "Parks Canada Reservations",
    stepVerificationSent: false,
    stepVerified: false,
    trxnId: null,
    viewPrivacy: false,
  },
  testData: {
    email: null,
    firstname: null,
    lastName: null,
    otp: null,
    password: null,
    phone: null,
    verificationCode: null,
  },
  authenticatedPages: [],
  cancelProfileEditing: false,
  relyingPartyInfo: null,
  urlLanguageBeforeEdit: null,
};

describe("ProfileNameEdit Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigateHelper.mockClear();
  });

  it("clicking Continue button goes to confirmation page", async () => {
    render(
      <BrowserRouter>
        <LanguageProvider>
          <UserProvider initial={mockUserState}>
            <ProfileNameEdit />
          </UserProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    // Fill in the form with some data first
    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    fireEvent.change(firstNameInput, { target: { value: "New" } });
    fireEvent.change(lastNameInput, { target: { value: "User" } });

    // Find the form by its ID and trigger submit
    const form = document.getElementById("form");
    fireEvent.submit(form);

    // Verify it navigates to the confirmation page
    await waitFor(() => {
      expect(mockNavigateHelper).toHaveBeenCalledWith(
        "/en/profile/update-name/confirm-update"
      );
    });
  });

  it("updates global editProfile state when form is submitted", async () => {
    let capturedState;

    // Create a component that captures the state for testing
    const StateCapture = () => {
      const { state } = useUser();
      capturedState = state;
      return null;
    };

    render(
      <BrowserRouter>
        <LanguageProvider>
          <UserProvider initial={mockUserState}>
            <ProfileNameEdit />
            <StateCapture />
          </UserProvider>
        </LanguageProvider>
      </BrowserRouter>
    );

    // Wait for the component to mount and cloneUserProfile to be called
    await waitFor(() => {
      expect(capturedState?.editProfile).toBeTruthy();
    });

    // Fill in the form with new data
    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    fireEvent.change(firstNameInput, {
      target: { name: "givenName", value: "New" },
    });
    fireEvent.change(lastNameInput, {
      target: { name: "familyName", value: "User" },
    });

    // Submit the form
    const form = document.getElementById("form");
    fireEvent.submit(form);

    // Verify navigation happens first
    await waitFor(() => {
      expect(mockNavigateHelper).toHaveBeenCalledWith(
        "/en/profile/update-name/confirm-update"
      );
    });

    // Check that the editProfile was updated in the context
    expect(capturedState?.editProfile?.name?.givenName).toBe("New");
    expect(capturedState?.editProfile?.name?.familyName).toBe("User");
    expect(capturedState?.editProfile?.name?.formatted).toBe("New User");
  });
});
