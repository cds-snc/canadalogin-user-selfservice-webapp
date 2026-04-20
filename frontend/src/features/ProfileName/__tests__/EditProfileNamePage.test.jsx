import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import EditProfileNamePage from "../components/EditProfileNamePage";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import "@testing-library/jest-dom/vitest";

// ---------------------------------------------------------------------------
// GCDS component mocks
// ---------------------------------------------------------------------------
vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({
    children,
    buttonId,
    onGcdsClick,
    disabled,
    buttonRole,
    ...props
  }) => (
    <button
      data-testid={buttonId}
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children, marginTop, marginBottom, ...props }) => (
    <div style={{ marginTop, marginBottom, ...props.style }} {...props}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({
    children,
    tag: _Tag = "h1",
    marginTop,
    marginBottom,
    ...props
  }) => (
    <h1 style={{ marginTop, marginBottom, ...props.style }} {...props}>
      {children}
    </h1>
  ),
  GcdsText: ({ children, marginTop, marginBottom, ...props }) => (
    <p style={{ marginTop, marginBottom, ...props.style }} {...props}>
      {children}
    </p>
  ),
  GcdsInput: ({
    inputId,
    name,
    type,
    value,
    onInput,
    onGcdsInput: _gi,
    validateOn: _va,
    label: _label,
    hint: _hint,
    errorMessage: _em,
    lang: _lang,
    required,
    ...domProps
  }) => (
    <input
      id={inputId}
      name={name}
      type={type}
      value={value ?? ""}
      onInput={onInput}
      required={required}
      data-testid={domProps["data-testid"]}
      {...domProps}
    />
  ),
  GcdsErrorMessage: ({ children, messageId, ...props }) => (
    <div data-testid="error-message" id={messageId} {...props}>
      {children}
    </div>
  ),
  GcdsErrorSummary: ({
    heading,
    errorLinks: _errorLinks,
    lang: _lang,
    ...props
  }) => (
    <div data-testid="error-summary" {...props}>
      {heading}
    </div>
  ),
  GcdsDetails: ({ children, ...props }) => (
    <details {...props}>{children}</details>
  ),
  GcdsIcon: ({ name, size: _size, className }) => (
    <div
      data-testid="warning-icon"
      data-icon-name={name}
      className={className}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Hook / utility mocks
// ---------------------------------------------------------------------------
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({ trackEvent: vi.fn() }),
}));

vi.mock("../../../hooks/useWizardPageTracking", () => ({
  useWizardPageTracking: vi.fn(),
}));

vi.mock("../../../services/authService", () => ({
  authService: {
    update_my_user_profile: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({ updateProfileSuccess: vi.fn() }),
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(() => "/en/profile"),
}));

vi.mock("../../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PAGES: {
      editProfileNamePage: "editProfileNamePage",
      profileUpdateNameConfirmUpdate: "profileUpdateNameConfirmUpdate",
      profileUpdateNameSuccess: "profileUpdateNameSuccess",
      ProfileHome: "ProfileHome",
    },
  };
});

vi.mock("../../../utils/apiErrorHandler", () => ({
  redirectToLogin: vi.fn(),
  handleApiError: vi.fn(),
}));

vi.mock("../../../components/InfoBlocks/ServicesWithAccessInfoSection", () => ({
  default: () => <div data-testid="services-info">Services info</div>,
}));

// Stub ConfirmUpdate and SuccessfullyUpdated so we can detect step transitions
// without rendering their full dependency trees.
vi.mock("../components/ConfirmUpdate", () => ({
  default: ({ nameFormData }) => (
    <div data-testid="confirm-update-step">
      Confirm: {nameFormData.givenName} {nameFormData.familyName}
    </div>
  ),
}));

vi.mock("../components/SuccessfullyUpdated", () => ({
  default: () => <div data-testid="success-step">Success</div>,
}));

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------
const mockSessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};

function buildUserState(
  name = { givenName: "", familyName: "", formatted: "" },
) {
  return {
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
        lastLogin: "2025-01-01T00:00:00Z",
        lastMFA: "2025-01-01T00:00:00Z",
        twoFactorAuthentication: true,
        pwdChangedTime: "2025-01-01T00:00:00Z",
      },
      emails: [{ value: "test@example.com", type: "primary" }],
      phoneNumbers: [],
      meta: {
        created: "2025-01-01T00:00:00Z",
        location: "test",
        lastModified: "2025-01-01T00:00:00Z",
        resourceType: "User",
      },
      userName: "test@example.com",
      preferredLanguage: "en",
      name,
    },
    relyingPartyInfo: null,
    authenticatedPages: [],
  };
}

const TestWrapper = ({ children, userState }) => (
  <BrowserRouter>
    <UserProvider
      initial={userState || buildUserState()}
      initialSessionTimeoutState={mockSessionTimeoutState}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function renderPage(userState) {
  render(
    <TestWrapper userState={userState}>
      <EditProfileNamePage />
    </TestWrapper>,
  );
}

function setInputValue(testId, name, value) {
  const input = screen.getByTestId(testId);
  fireEvent.input(input, { target: { name, value } });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("EditProfileNamePage — form validation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows 'last name required' error when familyName is empty on submit", async () => {
    renderPage(
      buildUserState({ givenName: "", familyName: "", formatted: "" }),
    );

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Enter a last name to continue. If you have a single name, enter it in the last name field.",
      );
    });
  });

  it("shows 'last name required' error after user clears familyName and submits", async () => {
    renderPage(
      buildUserState({
        givenName: "John",
        familyName: "Doe",
        formatted: "John Doe",
      }),
    );

    // Clear familyName
    setInputValue("familyName", "familyName", "");

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Enter a last name to continue. If you have a single name, enter it in the last name field.",
      );
    });
  });

  it("shows 'first name max length' error when givenName exceeds 80 characters", async () => {
    renderPage(
      buildUserState({
        givenName: "",
        familyName: "Smith",
        formatted: "Smith",
      }),
    );

    setInputValue("givenName", "givenName", "A".repeat(81));

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Your first name cannot be more than 80 characters. Try again.",
      );
    });
  });

  it("allows givenName of exactly 80 characters without error", async () => {
    renderPage(
      buildUserState({
        givenName: "",
        familyName: "Smith",
        formatted: "Smith",
      }),
    );

    setInputValue("givenName", "givenName", "A".repeat(80));

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-update-step")).toBeInTheDocument();
    });
  });

  it("shows 'last name max length' error when familyName exceeds 80 characters", async () => {
    renderPage(
      buildUserState({ givenName: "John", familyName: "", formatted: "John" }),
    );

    setInputValue("familyName", "familyName", "B".repeat(81));

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Your last name cannot be more than 80 characters. Try again.",
      );
    });
  });

  it("allows familyName of exactly 80 characters without error", async () => {
    renderPage(
      buildUserState({ givenName: "John", familyName: "", formatted: "John" }),
    );

    setInputValue("familyName", "familyName", "B".repeat(80));

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-update-step")).toBeInTheDocument();
    });
  });

  it("proceeds to the confirm step when all input is valid", async () => {
    renderPage(
      buildUserState({ givenName: "", familyName: "", formatted: "" }),
    );

    setInputValue("givenName", "givenName", "Jane");
    setInputValue("familyName", "familyName", "Smith");

    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-update-step")).toBeInTheDocument();
    });
  });

  it("does not proceed to confirm step when validation fails", async () => {
    renderPage(
      buildUserState({ givenName: "", familyName: "", formatted: "" }),
    );

    // Click continue without providing a last name
    const continueButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(
        screen.queryByTestId("confirm-update-step"),
      ).not.toBeInTheDocument();
    });
  });

  it("clears the error when user starts typing after a validation error", async () => {
    renderPage(
      buildUserState({ givenName: "", familyName: "", formatted: "" }),
    );

    // Trigger validation error first
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toBeInTheDocument();
    });

    // Typing in an input should clear the error
    setInputValue("familyName", "familyName", "S");

    await waitFor(() => {
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });
});
