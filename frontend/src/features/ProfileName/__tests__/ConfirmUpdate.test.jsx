import React from "react";
import { render, screen, act } from "@testing-library/react";
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
  relyingPartyInfo: {
    icon: "test-icon.png",
    id: "test-service-id",
    linkName: "Test Service",
    url: "https://test-service.example.com",
  },
  authenticatedPages: [],
};

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

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
  GcdsErrorMessage: ({ children, messageId, ...props }) => (
    <div {...props} data-testid="error-message" id={messageId}>
      {children}
    </div>
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

describe("ConfirmUpdate Component Tests", () => {
  const mockOnConfirm = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    nameFormData: {
      givenName: "John",
      familyName: "Doe",
      formatted: "John Doe",
    },
    onConfirm: mockOnConfirm,
    onCancel: mockOnCancel,
    errorMessage: "",
    localLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
    mockDispatch.mockClear();
  });

  it("displays formatted name correctly", async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...defaultProps} />
        </TestWrapper>,
      );
    });

    // Should display the formatted name
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it("calls onConfirm when Yes, update button is clicked", async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...defaultProps} />
        </TestWrapper>,
      );
    });

    const confirmButton = screen.getByText("Yes, update");
    confirmButton.click();

    expect(mockOnConfirm).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...defaultProps} />
        </TestWrapper>,
      );
    });

    const cancelButton = screen.getByText("Cancel");
    cancelButton.click();

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("displays error message when provided", async () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Test error message",
    };

    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...propsWithError} />
        </TestWrapper>,
      );
    });

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("shows loader when localLoading is true", async () => {
    const loadingProps = {
      ...defaultProps,
      localLoading: true,
    };

    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...loadingProps} />
        </TestWrapper>,
      );
    });

    // Should show loader instead of form content
    expect(screen.queryByText(/John Doe/)).not.toBeInTheDocument();
  });

  it("returns null when nameFormData.formatted is missing", async () => {
    const propsWithoutName = {
      ...defaultProps,
      nameFormData: {
        givenName: "John",
        familyName: "Doe",
        formatted: "",
      },
    };

    const { container } = render(
      <TestWrapper>
        <ConfirmUpdate {...propsWithoutName} />
      </TestWrapper>,
    );

    expect(container.firstChild).toBeNull();
  });

  it("renders all expected content sections", async () => {
    await act(async () => {
      render(
        <TestWrapper>
          <ConfirmUpdate {...defaultProps} />
        </TestWrapper>,
      );
    });

    // Check for heading
    expect(screen.getByText("Confirm name update")).toBeInTheDocument();

    // Check for confirmation text
    expect(
      screen.getByText(/You've requested to update your name to:/),
    ).toBeInTheDocument();

    // Check for service info
    expect(
      screen.getByText(
        /This will update your name with the following services:/,
      ),
    ).toBeInTheDocument();

    // Check for notice section
    expect(screen.getByText(/Heads up/)).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByText("Yes, update")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
