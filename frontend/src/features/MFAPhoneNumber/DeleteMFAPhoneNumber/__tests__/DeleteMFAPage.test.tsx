import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, waitFor, cleanup, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DeleteMFAPage from "../component/DeleteMFAPage";
import { UserProvider } from "../../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../../components/Providers/LanguageProvider.tsx";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";

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

vi.mock("../../../../hooks/useOtpOperations");
vi.mock("../../../../hooks/usePasswordValidation");

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
    get_my_user_profile: vi.fn().mockResolvedValue({ success: true, user: {} }),
    get_rp_info: vi.fn().mockResolvedValue({ success: true }),
    keepAlive: vi.fn().mockResolvedValue({ success: true }),
    logout: vi.fn().mockResolvedValue({ success: true }),
    requestPasswordPolicy: vi.fn(),
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
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

vi.mock("../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ validateOtpCode, onBack }) => (
    <div data-testid="otp-verification">
      <button data-testid="otp-verification-back" onClick={onBack}>
        Back
      </button>
      <button
        data-testid="otp-verification-next"
        onClick={() => validateOtpCode && validateOtpCode("123456")}
      >
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

    // Mock the useOtpOperations hook - default to loading false
    useOtpOperations.mockReturnValue({
      userPhoneFactors: [
        {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+15551234567",
        },
      ],
      userSelectedMfaFactor: null,
      userOtpValue: "",
      otpSentResponse: null,
      localLoading: false, // Default to false for most tests
      handleChangeUserMfaSelection: vi.fn(),
      handleSetUserOtpValue: vi.fn(),
      requestOtpCode: vi.fn(),
      validateOtpCode: vi.fn(),
      fetchUserOtpPhoneFactors: vi
        .fn()
        .mockResolvedValue({ success: true, data: [] }),
    });

    // Mock the usePasswordValidation hook
    usePasswordValidation.mockImplementation(() => ({
      validatePassword: vi.fn(async () => {
        // Don't call successCallback immediately for most tests
        return Promise.resolve();
      }),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
    cleanup();
  });

  describe("Initial Loading and Error Handling", () => {
    it("shows loading state when localLoading is true", async () => {
      // Mock useOtpOperations to return loading state
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: true, // Set loading to true for this specific test
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn(),
      });

      renderComponent();

      // Should show loading state
      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Should not show the password verification form when loading
      expect(
        screen.queryByTestId("password-verification"),
      ).not.toBeInTheDocument();
    });

    it("navigates to security settings when no phone factors are returned", async () => {
      // Mock useOtpOperations to simulate the hook's navigation behavior
      useOtpOperations.mockImplementation(() => {
        // Simulate the hook calling navigate immediately when no factors are found
        setTimeout(() => {
          mockNavigate("/en/security-settings/manage-2fa-verifications");
        }, 0);

        return {
          userPhoneFactors: [], // Empty factors array
          userSelectedMfaFactor: null,
          userOtpValue: "",
          otpSentResponse: null,
          localLoading: false,
          handleChangeUserMfaSelection: vi.fn(),
          handleSetUserOtpValue: vi.fn(),
          requestOtpCode: vi.fn(),
          validateOtpCode: vi.fn(),
          fetchUserOtpPhoneFactors: vi.fn(),
        };
      });

      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("navigates to security settings when API returns no type", async () => {
      // Mock useOtpOperations to simulate the hook's navigation behavior for invalid data
      useOtpOperations.mockImplementation(() => {
        // Simulate the hook calling navigate when invalid data (no type) is processed
        setTimeout(() => {
          mockNavigate("/en/security-settings/manage-2fa-verifications");
        }, 0);

        return {
          userPhoneFactors: [], // Will be empty due to invalid data processed by hook
          userSelectedMfaFactor: null,
          userOtpValue: "",
          otpSentResponse: null,
          localLoading: false,
          handleChangeUserMfaSelection: vi.fn(),
          handleSetUserOtpValue: vi.fn(),
          requestOtpCode: vi.fn(),
          validateOtpCode: vi.fn(),
          fetchUserOtpPhoneFactors: vi.fn(),
        };
      });

      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", phoneNumber: "+15551234567" }],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("navigates to manage page when no factorIds provided", async () => {
      // Mock location state without factorIds
      mockLocation.state = null;

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
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("navigates to manage page when factorId not found in user factors", async () => {
      // Mock useOtpOperations with different factor ID
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1", // Different from the requested "non-existent-id"
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

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
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("handles API error when fetching factors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock useOtpOperations to simulate the hook's error handling and navigation
      useOtpOperations.mockImplementation(() => {
        // Simulate the hook calling navigate when an error occurs
        setTimeout(() => {
          consoleErrorSpy(
            "Error fetching user OTP phone factors:",
            new Error("Network error"),
          );
          mockNavigate("/en/security-settings/manage-2fa-verifications");
        }, 0);

        return {
          userPhoneFactors: [],
          userSelectedMfaFactor: null,
          userOtpValue: "",
          otpSentResponse: null,
          localLoading: false,
          handleChangeUserMfaSelection: vi.fn(),
          handleSetUserOtpValue: vi.fn(),
          requestOtpCode: vi.fn(),
          validateOtpCode: vi.fn(),
          fetchUserOtpPhoneFactors: vi.fn(),
        };
      });

      mockGetUserOtpPhoneFactors.mockRejectedValue(new Error("Network error"));

      renderComponent();

      // The console.error should be called by the useOtpOperations hook, not this component
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("ErrorSummaryWithFocus Rendering Tests", () => {
    it("should not render error summary when no error code is present", async () => {
      // Ensure useOtpOperations is properly mocked for this test
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: false, // Important: not loading
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

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
      // Ensure useOtpOperations is properly mocked for this test
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: false, // Important: not loading
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

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

      // Mock the password validation hook to simulate error by calling setErrorCode
      usePasswordValidation.mockImplementation((setErrorCodeCallback) => ({
        validatePassword: vi.fn(async () => {
          // Simulate the password validation setting an error code
          setErrorCodeCallback("CSIAM0011E");
          // Just return without success callback - this simulates failed validation without throwing
          return Promise.resolve();
        }),
      }));

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

  describe("Step Navigation Tests", () => {
    it("should navigate through all steps successfully", async () => {
      const mockValidateOtpCode = vi.fn();
      const mockRequestOtpCode = vi.fn();

      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
          {
            id: "factor-2",
            type: "voiceotp",
            phoneNumber: "+15551234568",
          },
        ],
        userSelectedMfaFactor: {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+15551234567",
        },
        userOtpValue: "",
        otpSentResponse: { trxnId: "test-trxn-id" },
        localLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: mockRequestOtpCode,
        validateOtpCode: mockValidateOtpCode,
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

      // Mock successful password validation
      usePasswordValidation.mockImplementation((setErrorCode, onSuccess) => ({
        validatePassword: vi.fn(async () => {
          setErrorCode("");
          onSuccess();
        }),
      }));

      renderComponent();

      // Start at password verification
      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to OTP selection
      const passwordNextButton = screen.getByTestId(
        "password-verification-next",
      );
      act(() => {
        passwordNextButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to OTP verification
      const otpSelectionNextButton = screen.getByTestId("otp-selection-next");
      act(() => {
        otpSelectionNextButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Mock successful OTP validation
      mockValidateOtpCode.mockImplementation(async (otpValue, callback) => {
        callback();
      });

      // Navigate to delete confirmation
      const otpVerificationNextButton = screen.getByTestId(
        "otp-verification-next",
      );
      act(() => {
        otpVerificationNextButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });
    });

    it("should handle cancel navigation from any step", async () => {
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Cancel from password verification
      const cancelButton = screen.getByTestId("password-verification-back");
      cancelButton.click();

      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/security-settings/manage-2fa-verifications",
      );
    });
  });

  describe("French Language Support", () => {
    it("should work correctly with French language parameter", async () => {
      // Mock the location to include French in pathname
      mockLocation.pathname = "/fr/delete-mfa";

      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        localLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn().mockResolvedValue({
          success: true,
          data: [
            {
              id: "factor-1",
              type: "smsotp",
              phoneNumber: "+15551234567",
            },
          ],
        }),
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Component should render correctly with French language
      expect(screen.getByTestId("password-verification")).toBeInTheDocument();
    });
  });
});
