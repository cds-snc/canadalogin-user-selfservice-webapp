import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import ConfirmUpdate from "../components/ConfirmUpdate.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom/vitest";

// Mock variables need to be declared first
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();

// Mock the user hooks
const mockUserState = {
  isLoading: false,
  loadingText: null,
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

// Mock react-router with useLocation
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
    useLocation: vi.fn(),
  };
});

// Import the mocked useLocation
import { useLocation } from "react-router";

// Mock constants - CORRECTED
vi.mock("../../../utils/constants.jsx", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PAGES: {
      profileUpdateNameConfirmUpdate: "profileUpdateNameConfirmUpdate",
      profileUpdateNameSuccess: "profileUpdateNameSuccess",
      ProfileHome: "ProfileHome",
      profileUpdateName: "profileUpdateName",
    },
    CONTEXT_ACTIONS: {
      update_user_profile: "update_user_profile",
      set_user_data: "set_user_data",
      set_loading: "set_loading",
      set_loading_text: "set_loading_text",
      set_relying_party_info: "set_relying_party_info",
    },
    SERVICES: [
      {
        title: "Test Service",
        id: "test-service",
      },
    ],
  };
});

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, tag, ...props }) => {
    const Component = tag || "h1";
    return React.createElement(Component, props, children);
  },
  GcdsText: ({ children, marginBottom, ...props }) => (
    <p {...props} style={{ marginBottom }}>
      {children}
    </p>
  ),
  GcdsNotice: ({ children, type, noticeTitle, noticeTitleTag, ...props }) => {
    const TitleComponent = noticeTitleTag || "h2";
    return (
      <div {...props} data-notice-type={type}>
        {noticeTitle && React.createElement(TitleComponent, {}, noticeTitle)}
        {children}
      </div>
    );
  },
  GcdsButton: ({ children, buttonRole, onGcdsClick, ...props }) => (
    <button {...props} onClick={onGcdsClick} data-button-role={buttonRole}>
      {children}
    </button>
  ),
}));

// Mock utility functions
vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: () => ({
    1: "Confirm name update",
    2: "You've requested to update your name to:",
    4: "This will update your name with the following services:",
    5: "Service 1",
    7: "Heads up",
    8: "Yes, update",
    9: "Cancel",
    10: "Service 2",
    11: "This does not",
    12: "legally change your name.",
  }),
}));

// Mock route helpers
vi.mock("../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page) => {
    const routes = {
      profileUpdateNameSuccess: `/en/profile/update-name/success`,
      ProfileHome: `/en/profile`,
      profileUpdateName: `/en/profile/update-name`,
    };
    return routes[page] || `/en/profile`;
  }),
}));

vi.mock("../../../services/authService.jsx", () => ({
  authService: {
    get_my_user_profile: vi.fn(() =>
      Promise.resolve({
        data: mockUserState.userProfile,
      }),
    ),
    update_my_user_profile: vi.fn(() =>
      Promise.resolve({
        data: {
          id: "test-user-123",
          name: {
            givenName: "John",
            familyName: "Doe",
            formatted: "John Doe",
          },
        },
      }),
    ),
    get_rp_info: vi.fn(() =>
      Promise.resolve({
        data: {
          url: "https://example.com",
          linkName: "Example Service",
          icon: "https://example.com/icon.png",
          id: "test-service-id",
        },
      }),
    ),
  },
}));

// Mock user profile dispatch
vi.mock("../../../utils/userProfileDispatch.jsx", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: vi.fn(),
  }),
}));

const mockSessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};

// Mock the user hooks
vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: mockDispatch,
  }),
}));

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider
      initial={mockUserState}
      initialSessionTimeoutState={mockSessionTimeoutState}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("ConfirmUpdate Component - Location State Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockDispatch.mockClear();
  });

  describe("when location.state contains valid name data", () => {
    beforeEach(() => {
      useLocation.mockReturnValue({
        state: {
          name: {
            givenName: "John",
            familyName: "Doe",
            formatted: "John Doe",
          },
        },
        pathname: "/en/profile/update-name/confirm-update",
      });
    });

    it("extracts name from location.state correctly", async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ConfirmUpdate />
          </TestWrapper>,
        );
      });

      // Should display the formatted name
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
    });

    it("does not redirect when name data is present", async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ConfirmUpdate />
          </TestWrapper>,
        );
      });

      // Wait a bit to ensure useEffect has run
      await waitFor(() => {
        expect(mockNavigate).not.toHaveBeenCalled();
      });
    });
  });

  describe("when location.state is null or undefined", () => {
    beforeEach(() => {
      useLocation.mockReturnValue({
        state: null,
        pathname: "/en/profile/update-name/confirm-update",
      });
    });

    it("redirects to edit page when location.state is null", async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ConfirmUpdate />
          </TestWrapper>,
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/en/profile/update-name");
      });
    });
  });

  describe("when location.state exists but name is missing", () => {
    beforeEach(() => {
      useLocation.mockReturnValue({
        state: {
          someOtherData: "value",
        },
        pathname: "/en/profile/update-name/confirm-update",
      });
    });

    it("redirects to edit page when name is missing from state", async () => {
      await act(async () => {
        render(
          <TestWrapper>
            <ConfirmUpdate />
          </TestWrapper>,
        );
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/en/profile/update-name");
      });
    });
  });
});
