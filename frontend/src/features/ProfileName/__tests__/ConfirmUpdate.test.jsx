import React from "react";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import ConfirmUpdate from "../components/ConfirmUpdate";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
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
    contactNumber: "+1234567890",
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
vi.mock("../../../utils/constants", async (importOriginal) => {
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

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, tag, ...props }) => {
    const Component = tag || "h1";
    return React.createElement(Component, props, children);
  },
  GcdsText: ({ children, marginBottom, ...props }) => (
    <div {...props} style={{ marginBottom }}>
      {children}
    </div>
  ),
  GcdsNotice: ({
    children,
    noticeRole,
    noticeTitle,
    noticeTitleTag,
    ...props
  }) => {
    const TitleComponent = noticeTitleTag || "h2";
    return (
      <div {...props} data-notice-role={noticeRole}>
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

// Mock route helpers
vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn((page) => {
    const routes = {
      profileUpdateNameSuccess: `/en/profile/update-name/success`,
      ProfileHome: `/en/profile`,
      profileUpdateName: `/en/profile/update-name`,
    };
    return routes[page] || `/en/profile`;
  }),
}));

vi.mock("../../../services/authService", () => ({
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
vi.mock("../../../utils/userProfileDispatch", () => ({
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
vi.mock("../../../components/Providers/useUser", () => ({
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

    let container;
    await act(async () => {
      ({ container } = render(
        <TestWrapper>
          <ConfirmUpdate {...propsWithoutName} />
        </TestWrapper>,
      ));
    });

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
    expect(
      screen.getByText("Are you sure you want to update your name?"),
    ).toBeInTheDocument();

    // Check for confirmation text
    expect(
      screen.getByText(/You've requested to update your name to:/),
    ).toBeInTheDocument();

    // Check for service info (bold formatting splits text across elements)
    expect(
      screen.getByText(
        (content, element) =>
          element?.tagName === "DIV" &&
          element?.getAttribute("style")?.includes("margin-bottom: 0") &&
          (element?.textContent?.includes(
            "This will update your name with all services you have connected to your CanadaLogin.",
          ) ??
            false),
      ),
    ).toBeInTheDocument();

    // Check for notice section
    expect(screen.getByText(/does not/)).toBeInTheDocument();

    // Check for buttons
    expect(screen.getByText("Yes, update")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
