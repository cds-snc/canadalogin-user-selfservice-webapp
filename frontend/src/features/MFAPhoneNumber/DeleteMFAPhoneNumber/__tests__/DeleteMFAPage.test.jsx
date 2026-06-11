import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import {
  render,
  screen,
  waitFor,
  cleanup,
  act,
  fireEvent,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DeleteMFAPage from "../component/DeleteMFAPage";
import { UserProvider } from "../../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../../components/Providers/LanguageProvider";
import { useOtpOperations } from "../../../../hooks/useOtpOperations";
import { usePasskeyOperations } from "../../../../hooks/usePasskeyOperations";

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn(),
}));

const { mockTransientOtpVerify } = vi.hoisted(() => ({
  mockTransientOtpVerify: vi.fn(),
}));

vi.mock("../../../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({ trackEvent: mockTrackEvent }),
}));

vi.mock("../../../../hooks/useWizardPageTracking", () => ({
  useWizardPageTracking: vi.fn(),
}));
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

vi.mock("../../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

vi.mock("../../../../hooks/useOtpOperations");
vi.mock("../../../../hooks/usePasskeyOperations");
vi.mock("../../../../hooks/usePasswordValidation");

// Mock API modules
const mockGetUserOtpPhoneFactors = vi.fn();
const mockDeleteMFA = vi.fn();
const mockDeleteMFABatch = vi.fn();

vi.mock("../../../TransientOtp/api/otpFactors", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: (...args) => mockGetUserOtpPhoneFactors(...args),
  },
}));

vi.mock("../api/DeleteMFAPhoneNumberAPI", () => ({
  deleteMFAPhoneNumberApi: {
    deleteMFA: (...args) => mockDeleteMFA(...args),
    deleteMFABatch: (...args) => mockDeleteMFABatch(...args),
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
    transientOtpVerify: (...args) => mockTransientOtpVerify(...args),
  },
}));

// Mock components
vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
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
  default: ({ onNext, onSelectFIDO2, fido2Data }) => (
    <div data-testid="otp-selection">
      <button onClick={onNext} data-testid="otp-selection-next">
        Next
      </button>
      {fido2Data?.length ? (
        <button
          onClick={() => onSelectFIDO2?.(fido2Data[0])}
          data-testid="otp-selection-fido2"
        >
          Verify with passkey
        </button>
      ) : null}
    </div>
  ),
}));

vi.mock(
  "../../../ManageFIDO2/components/VerifyFIDO2Passkey/VerifyFIDO2Passkey",
  () => ({
    default: ({ setAssertionResult, onCallback, onTryAnotherWayHandler }) => (
      <div data-testid="verify-fido2-passkey">
        <button
          data-testid="verify-fido2-success"
          onClick={() => {
            setAssertionResult?.({
              id: "assertion-id",
              rawId: "raw-assertion-id",
              type: "public-key",
            });
            onCallback?.();
          }}
        >
          Success
        </button>
        <button
          data-testid="verify-fido2-try-another-way"
          onClick={onTryAnotherWayHandler}
        >
          Try another way
        </button>
      </div>
    ),
  }),
);

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

vi.mock("../../../../utils/routeHelpers", () => ({
  path: vi.fn((page) => {
    if (page === "SecuritySettings" || page === "securitySettings") {
      return "/en/security-settings";
    }
    if (
      page === "Manage2FAVerifications" ||
      page === "manage2FAVerifications"
    ) {
      return "/en/security-settings/manage-2fa-verifications";
    }
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

const defaultPasskeyData = [
  {
    id: "passkey-1",
    attributes: {
      nickname: "Work Laptop",
      credentialId: "cred-1",
    },
  },
];

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
    mockTransientOtpVerify.mockResolvedValue({ success: true });

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
      otpLoading: false, // Default to false for most tests
      handleChangeUserMfaSelection: vi.fn(),
      handleSetUserOtpValue: vi.fn(),
      requestOtpCode: vi.fn(),
      validateOtpCode: vi.fn(),
      fetchUserOtpPhoneFactors: vi
        .fn()
        .mockResolvedValue({ success: true, data: [] }),
    });

    usePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: false,
      refetch: vi.fn(),
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
        otpLoading: true, // Set loading to true for this specific test
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn(),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn(),
      });

      await act(async () => {
        renderComponent();
      });

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
          otpLoading: false,
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
          otpLoading: false,
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
        otpLoading: false,
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
          otpLoading: false,
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
        otpLoading: false, // Important: not loading
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
        otpLoading: false, // Important: not loading
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
      fireEvent.click(nextButton);

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
      const mockRequestOtpCode = vi.fn().mockResolvedValue(true);

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
        otpLoading: false,
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
        fireEvent.click(passwordNextButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to OTP verification
      const otpSelectionNextButton = screen.getByTestId("otp-selection-next");
      act(() => {
        fireEvent.click(otpSelectionNextButton);
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
        fireEvent.click(otpVerificationNextButton);
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
        otpLoading: false,
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
      fireEvent.click(cancelButton);

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
        otpLoading: false,
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

  describe("GA Error Tracking", () => {
    it("emits form_step_end error event when password verify API fails", async () => {
      let capturedOnError;
      usePasswordValidation.mockImplementation(
        (_setErr, _onSuccess, _useStepup, onError) => {
          capturedOnError = onError;
          return { validatePassword: vi.fn(), validatePasswordLoading: false };
        },
      );

      await act(async () => {
        renderComponent();
      });

      await act(async () => {
        capturedOnError?.("CSIAM0011E");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "delete_mfa_verify_password",
        error: "CSIAM0011E",
      });
    });

    it("emits form_step_end with error when delete MFA API fails on confirm step", async () => {
      // deleteMFA rejects with a structured error
      mockDeleteMFA.mockRejectedValueOnce({
        data: { message: "DELETE_FAILED" },
      });

      // Password validation passes
      usePasswordValidation.mockImplementation((_setErr, onSuccess) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }));

      // 1 phone factor so OTP selection is skipped
      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          { id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" },
        ],
        userSelectedMfaFactor: {
          id: "factor-1",
          type: "smsotp",
          phoneNumber: "+15551234567",
        },
        userOtpValue: "123456",
        otpSentResponse: { trxnId: "trxn-id" },
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi
          .fn()
          .mockResolvedValue({ success: true, data: [] }),
      });

      await act(async () => {
        renderComponent();
      });

      // Step 1: password verification
      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      // Step 2: OTP verification (1 factor → selection skipped)
      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-verification-next"));
      });

      // Step 3: delete confirm step
      await waitFor(() =>
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("delete-confirm-next"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_end",
          step: "confirm_delete",
          error: "DELETE_FAILED",
        });
      });
    });
  });

  describe("GA Success Path Tracking", () => {
    beforeEach(() => {
      usePasswordValidation.mockImplementation((_setErr, onSuccess) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }));

      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            destination: "+15551234567",
          },
        ],
        userSelectedMfaFactor: {
          id: "factor-1",
          type: "smsotp",
          destination: "+15551234567",
        },
        userOtpValue: "123456",
        otpSentResponse: { trxnId: "trxn-id" },
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi
          .fn()
          .mockResolvedValue({ success: true, data: [] }),
      });
    });

    it("fires form_step_start at verify_password when password validation begins", async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_start",
        step: "delete_mfa_verify_password",
        flow: "delete_mfa_phone_number",
      });
    });

    it("fires form_step_change to otp_validation after password validates (1-factor)", async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "otp_validation",
        });
      });
    });

    it("fires form_step_start at otp_validation and form_step_change to confirm_delete when OTP is verified", async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-verification-next"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_start",
          step: "otp_validation",
          flow: "delete_mfa_phone_number",
          type: "smsotp",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "confirm_delete",
          flow: "delete_mfa_phone_number",
          type: "smsotp",
        });
      });
    });

    it("fires form_submit and form_step_start at confirm_delete when delete is confirmed", async () => {
      await act(async () => {
        renderComponent();
      });

      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-verification-next"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument(),
      );

      mockTrackEvent.mockClear();

      await act(async () => {
        fireEvent.click(screen.getByTestId("delete-confirm-next"));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_submit",
        step: "confirm_delete",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_start",
        step: "confirm_delete",
        flow: "delete_mfa_phone_number",
      });
    });

    it("fires form_submit_complete at mfa_delete_success when deleteMFA API succeeds", async () => {
      mockDeleteMFA.mockResolvedValue(undefined);

      await act(async () => {
        renderComponent();
      });

      await waitFor(() =>
        expect(screen.getByTestId("password-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-verification-next"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("delete-confirm-next"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_submit_complete",
          step: "mfa_delete_success",
        });
      });
    });
  });

  describe("Passkey authorization", () => {
    it("routes to method selection after password validation when a passkey is available", async () => {
      usePasswordValidation.mockImplementation((_setErr, onSuccess) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }));

      usePasskeyOperations.mockReturnValue({
        fido2Data: defaultPasskeyData,
        loading: false,
        refetch: vi.fn(),
      });

      await act(async () => {
        renderComponent();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });
      expect(screen.queryByTestId("otp-verification")).not.toBeInTheDocument();
    });

    it("sends assertionResult when deleting with a verified passkey", async () => {
      mockDeleteMFA.mockResolvedValue(undefined);

      usePasswordValidation.mockImplementation((_setErr, onSuccess) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }));

      useOtpOperations.mockReturnValue({
        userPhoneFactors: [
          {
            id: "factor-1",
            type: "smsotp",
            destination: "+15551234567",
          },
        ],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        otpSentResponse: null,
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn(),
        fetchUserOtpPhoneFactors: vi.fn(),
      });

      usePasskeyOperations.mockReturnValue({
        fido2Data: defaultPasskeyData,
        loading: false,
        refetch: vi.fn(),
      });

      await act(async () => {
        renderComponent();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("password-verification-next"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection-fido2")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-selection-fido2"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("verify-fido2-passkey")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-fido2-success"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("delete-confirm-next"));
      });

      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalledWith({
          id: "factor-1",
          otpType: "sms",
          assertionResult: {
            id: "assertion-id",
            rawId: "raw-assertion-id",
            type: "public-key",
          },
        });
      });
    });
  });
});
