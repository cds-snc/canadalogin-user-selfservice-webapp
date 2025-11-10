import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DeleteMFAPage from "../component/DeleteMFAPage.jsx";
import { UserProvider } from "../../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../../components/Providers/LanguageProvider.tsx";

// Mock the navigation hooks
const mockNavigate = vi.fn();
const mockNavigateHelper = vi.fn();
const mockLocation = {
  state: { factorIds: ["factor-1"] },
  pathname: "/en/delete-mfa",
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: vi.fn(() => ({ language: "en" })),
    useLocation: () => mockLocation,
  };
});

vi.mock("../../../../hooks/useNavigate.tsx", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock API modules
const mockGetUserOtpPhoneFactors = vi.fn();
const mockDeleteMFA = vi.fn();

vi.mock("../../../TransientOtp/api/otpFactors", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: (...args) => mockGetUserOtpPhoneFactors(...args),
  },
}));

vi.mock("../api/DeleteMFAPhoneNumberAPI", () => ({
  deleteMFAPhoneNumberApi: {
    deleteMFA: (...args) => mockDeleteMFA(...args),
  },
}));

// Mock utils and services
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === "error") {
      if (language === "fr") {
        return {
          CSIAM0011E: "Votre compte a été verrouillé.",
          7: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
        };
      }
      return {
        CSIAM0011E: "Your account has been locked.",
        7: "An unexpected error occurred. Please try again later.",
      };
    }
    return {};
  }),
}));

vi.mock("../../../../services/authService", () => ({
  authService: {
    verifyPassword: vi.fn(),
  },
}));

// Mock components
vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsErrorMessage: ({ children, messageId }) => (
    <div data-testid="error-message" data-message-id={messageId}>
      {children}
    </div>
  ),
  GcdsContainer: ({ children, className }) => (
    <div data-testid="gcds-container" className={className}>
      {children}
    </div>
  ),
  GcdsHeading: ({ tag, lang, children }) => (
    <div data-testid="gcds-heading" data-tag={tag} data-lang={lang}>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsInput: () => <input data-testid="mock-gcds-input" />,
  GcdsGrid: () => <div data-testid="mock-gcds-grid" />,
  GcdsButton: () => <button>Mocked GcdsButton</button>,
  GcdsLink: () => <a>Mocked GcdsLink</a>,
  GcdsErrorSummary: ({
    children,
    id,
    errorLinks,
    heading,
    lang,
    className,
    ...otherProps
  }) => (
    <div
      id={id}
      className={className}
      data-testid="gcds-error-summary"
      data-heading={heading}
      data-lang={lang}
      tabIndex="-1"
      {...otherProps}
    >
      <h2 data-testid="error-summary-heading">{heading}</h2>
      <ul data-testid="error-summary-links">
        {Object.entries(errorLinks || {}).map(([href, text], index) => (
          <li key={index}>
            <a href={href} data-testid={`error-link-${index}`}>
              {text}
            </a>
          </li>
        ))}
      </ul>
      {children}
    </div>
  ),
}));

// Mock child components
vi.mock("../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext }) => (
    <div data-testid="otp-selection">
      <button onClick={onNext} data-testid="otp-selection-next">
        Next
      </button>
    </div>
  ),
}));

vi.mock("../../../TransientOtp/components/OtpVerification", async () => {
  const React = await import("react");
  return {
    default: function MockOtpVerification({
      validateOtpCode,
      requestOtpCode,
      onBack,
    }) {
      // Call requestOtpCode when component mounts to simulate the real behavior
      React.useEffect(() => {
        if (requestOtpCode) {
          requestOtpCode();
        }
      }, [requestOtpCode]);

      return (
        <div data-testid="otp-verification">
          <button onClick={validateOtpCode} data-testid="otp-verification-next">
            Next
          </button>
          <button onClick={onBack} data-testid="otp-verification-back">
            Back
          </button>
        </div>
      );
    },
  };
});

vi.mock("../../../TransientOtp/components/PasswordVerification", () => ({
  default: ({ validatePassword, onCancel }) => (
    <div data-testid="password-verification">
      <button
        onClick={async () => await validatePassword("testpassword")}
        data-testid="password-verification-next"
      >
        Next
      </button>
      <button onClick={onCancel} data-testid="password-verification-back">
        Back
      </button>
    </div>
  ),
}));

vi.mock("./DeleteMFAPhoneNumberConfirm", () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="delete-mfa-confirm">
      <button onClick={onNext} data-testid="delete-mfa-confirm-next">
        Next
      </button>
      <button onClick={onBack} data-testid="delete-mfa-confirm-back">
        Back
      </button>
    </div>
  ),
}));

vi.mock(
  "../../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus",
  () => ({
    default: ({ errorCode, language }) =>
      errorCode ? (
        <div
          data-testid="error-summary-with-focus"
          data-error-code={errorCode}
          data-language={language}
        >
          Error Summary: {errorCode}
        </div>
      ) : null,
  }),
);

vi.mock("../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext }) => (
    <div data-testid="otp-selection">
      <button data-testid="otp-selection-next" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}));

vi.mock("../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="otp-verification">
      <button data-testid="otp-verification-back" onClick={onBack}>
        Back
      </button>
      <button data-testid="otp-verification-next" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}));

vi.mock("../component/DeleteMFAPhoneNumberConfirm", () => ({
  default: ({ onNext, onCancel }) => (
    <div data-testid="delete-confirm">
      <button data-testid="delete-confirm-cancel" onClick={onCancel}>
        Cancel
      </button>
      <button data-testid="delete-confirm-next" onClick={onNext}>
        Delete
      </button>
    </div>
  ),
}));

vi.mock(
  "../../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus",
  () => ({
    default: ({ errorCode, language }) =>
      errorCode ? (
        <div
          data-testid="error-summary-with-focus"
          data-error-code={errorCode}
          data-language={language}
        >
          Error Summary: {errorCode}
        </div>
      ) : null,
  }),
);

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsErrorMessage: ({ children, messageId }) => (
    <div data-testid="error-message" data-message-id={messageId}>
      {children}
    </div>
  ),
  GcdsContainer: ({ children, className }) => (
    <div data-testid="gcds-container" className={className}>
      {children}
    </div>
  ),
  GcdsHeading: ({ tag, lang, children }) => (
    <div data-testid="gcds-heading" data-tag={tag} data-lang={lang}>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsInput: () => <input data-testid="mock-gcds-input" />,
  GcdsGrid: () => <div data-testid="mock-gcds-grid" />,
  GcdsButton: () => <button>Mocked GcdsButton</button>, // Mocking GcdsButton
  GcdsLink: () => <a>Mocked GcdsLink</a>, // Mocking GcdsLink
  GcdsErrorSummary: ({
    children,
    id,
    errorLinks,
    heading,
    lang,
    className,
    ...otherProps
  }) => (
    <div
      id={id}
      className={className}
      data-testid="gcds-error-summary"
      data-heading={heading}
      data-lang={lang}
      tabIndex="-1"
      {...otherProps}
    >
      <h2 data-testid="error-summary-heading">{heading}</h2>
      <ul data-testid="error-summary-links">
        {Object.entries(errorLinks || {}).map(([href, text], index) => (
          <li key={index}>
            <a href={href} data-testid={`error-link-${index}`}>
              {text}
            </a>
          </li>
        ))}
      </ul>
      {children}
    </div>
  ),
}));

// Mock utilities
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === "error" || page === "Error") {
      return {
        7: "An unexpected error occurred",
        "Unexpected API request error": "Unexpected error",
      };
    }
    return { 11: "Loading..." };
  }),
}));

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page) => {
    if (page === "SecuritySettings" || page === "securitySettings")
      return "/en/security-settings";
    if (page === "Manage2FAVerifications" || page === "manage2FAVerifications")
      return "/en/security-settings/manage-2fa-verifications";
    return "/en/test";
  }),
}));

vi.mock("../../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../../utils/constants");
  return {
    ...actual,
    serverMapping: {
      smsotp: "sms",
      voiceotp: "voice",
    },
  };
});

vi.mock("../../../../services/authService", () => ({
  authService: {
    requestPasswordPolicy: vi.fn(),
    verifyPassword: vi.fn(),
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
  },
}));

const mockUserState = {
  userProfile: {
    id: "test-user-123",
    name: { givenName: "Test", familyName: "User" },
    emails: [{ value: "test@example.com" }],
  },
};

const renderComponent = (userState = mockUserState, locationState = null) => {
  if (locationState !== null) {
    mockLocation.state = locationState;
  }

  return render(
    <BrowserRouter>
      <UserProvider initial={userState}>
        <LanguageProvider>
          <DeleteMFAPage />
        </LanguageProvider>
      </UserProvider>
    </BrowserRouter>,
  );
};

describe("DeleteMFAPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.state = { factorIds: ["factor-1"] };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Loading and Error Handling", () => {
    it("shows loading state while fetching OTP factors", async () => {
      mockGetUserOtpPhoneFactors.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: [
                    {
                      id: "factor-1",
                      type: "smsotp",
                      phoneNumber: "+15551234567",
                    },
                  ],
                }),
              100,
            ),
          ),
      );

      renderComponent();

      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
      });
    });

    it("navigates to security settings when no phone factors are returned", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings",
        );
      });
    });

    it("navigates to security settings when API returns no type", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", phoneNumber: "+15551234567" }],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings",
        );
      });
    });

    it("navigates to manage page when no factorIds provided", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent(mockUserState, {});

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("navigates to manage page when factorId not found in user factors", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent(mockUserState, { factorIds: ["non-existent-id"] });

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("handles API error when fetching factors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetUserOtpPhoneFactors.mockRejectedValue(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching user OTP phone factors:",
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ErrorSummaryWithFocus Rendering Tests", () => {
    it("should not render error summary when no error code is present", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId("error-summary-with-focus"),
      ).not.toBeInTheDocument();
    });

    it("should render error summary when user enters incorrect password", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      // Mock authService to fail password verification
      const authService = await import("../../../../services/authService");
      authService.authService.requestPasswordPolicy = vi
        .fn()
        .mockResolvedValue({
          success: true,
          data: { pwdMinLength: 12, pwdMaxLength: 65 },
        });
      authService.authService.verifyPassword = vi.fn().mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Initially no error should be shown
      expect(
        screen.queryByTestId("error-summary-with-focus"),
      ).not.toBeInTheDocument();

      // Click the next button to trigger password validation (which will fail)
      const nextButton = screen.getByTestId("password-verification-next");
      nextButton.click();

      // Wait for error summary to appear
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      const errorSummary = screen.getByTestId("error-summary-with-focus");
      expect(errorSummary).toHaveAttribute("data-error-code", "CSIAM0011E");
      expect(errorSummary).toHaveAttribute("data-language", "en");
      expect(errorSummary).toHaveTextContent("Error Summary: CSIAM0011E");
    });
  });
});
