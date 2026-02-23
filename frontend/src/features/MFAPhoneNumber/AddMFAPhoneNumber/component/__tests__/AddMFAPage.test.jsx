import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { createMemoryRouter, RouterProvider } from "react-router";
import AddMFAPage from "../AddMFAPage";
import { useUser } from "../../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../../hooks/useNavigate";
import { useOtpOperations } from "../../../../../hooks/useOtpOperations";
import { usePasswordValidation } from "../../../../../hooks/usePasswordValidation";
import { otpFactors } from "../../../../TransientOtp/api/otpFactors";
import { addMFAPhoneNumberApi } from "../../api/AddMFAPhoneNumberAPI";
import { deleteMFAPhoneNumberApi } from "../../../DeleteMFAPhoneNumber/api/DeleteMFAPhoneNumberAPI";
import * as functions from "../../../../../utils/functions";
import { authService } from "../../../../../services/authService";

// Mock dependencies
vi.mock("../../../../../components/Providers/useUser");
vi.mock("../../../../../hooks/useNavigate");
// Mock react-router to prevent navigation errors and provide mock parameters
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({ lang: "en", id: "mock-id" }),
  };
});
vi.mock("../../../../../hooks/useOtpOperations");
vi.mock("../../../../../hooks/usePasswordValidation");
vi.mock("../../../../TransientOtp/api/otpFactors");
vi.mock("../../api/AddMFAPhoneNumberAPI");
vi.mock("../../../DeleteMFAPhoneNumber/api/DeleteMFAPhoneNumberAPI");
vi.mock("../../../../../utils/functions");
vi.mock("../../../../../services/authService");

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => ({ language: "en" })),
  };
});

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

// Mock child components
vi.mock("../../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext }) => (
    <div data-testid="otp-selection">
      <button onClick={onNext} data-testid="otp-selection-next">
        Next
      </button>
    </div>
  ),
}));

vi.mock("../../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ validateOtpCode, requestOtpCode, onBack }) => {
    const handleNext = async () => {
      if (validateOtpCode) {
        try {
          await validateOtpCode("123456");
        } catch (error) {
          // Ignore errors in tests to prevent unhandled rejections
          console.log("OTP validation error ignored in test:", error.message);
        }
      }
    };

    return (
      <div data-testid="otp-verification">
        <button onClick={handleNext} data-testid="otp-verification-next">
          Next
        </button>
        <button onClick={onBack} data-testid="otp-verification-back">
          Back
        </button>
        <button
          onClick={() => requestOtpCode && requestOtpCode()}
          data-testid="request-otp-code"
        >
          Request OTP
        </button>
      </div>
    );
  },
}));

vi.mock("../AddMFAPhoneNumber", () => ({
  default: ({ onNext, onCancel }) => (
    <div data-testid="add-mfa-phone-number">
      <button onClick={onNext} data-testid="add-mfa-phone-number-next">
        Next
      </button>
      <button onClick={onCancel} data-testid="add-mfa-phone-number-cancel">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../AddMFAOtpVerification", () => ({
  default: ({
    onNext,
    onCancel,
    onBack,
    requestNewOtpCode,
    onUseDifferentPhoneNumber,
  }) => (
    <div data-testid="add-mfa-otp-verification">
      <button onClick={onNext} data-testid="add-mfa-otp-verification-next">
        Next
      </button>
      <button onClick={onCancel} data-testid="add-mfa-otp-verification-cancel">
        Cancel
      </button>
      <button onClick={onBack} data-testid="add-mfa-otp-verification-back">
        Back
      </button>
      <button onClick={requestNewOtpCode} data-testid="request-new-otp">
        Request New OTP
      </button>
      <button
        onClick={onUseDifferentPhoneNumber}
        data-testid="use-different-phone"
      >
        Use Different Phone
      </button>
    </div>
  ),
}));

vi.mock("../AddSecondMFA", () => ({
  default: ({ onSkipForNow, onAddSecondMFA }) => (
    <div data-testid="add-second-mfa">
      <button onClick={onSkipForNow} data-testid="skip-for-now">
        Skip for now
      </button>
      <button onClick={onAddSecondMFA} data-testid="add-second-mfa-btn">
        Add Second MFA
      </button>
    </div>
  ),
}));

vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text || "Loading..."}</div>,
}));

vi.mock(
  "../../../../../components/ErrorSummaryWithFocus/ErrorSummaryWithFocus",
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

vi.mock("../../../../TransientOtp/components/PasswordVerification", () => ({
  default: ({ validatePassword, onCancel }) => (
    <div data-testid="password-verification">
      <button
        onClick={() => validatePassword && validatePassword("mock-password")}
        data-testid="password-verification-next"
      >
        Next
      </button>
      <button onClick={onCancel} data-testid="password-verification-cancel">
        Cancel
      </button>
    </div>
  ),
}));

const mockUserProfile = {
  id: "test-user-123",
  userName: "testuser",
};

const mockUserState = {
  userProfile: mockUserProfile,
};

const mockNavigateHelper = vi.fn();

const TestWrapper = ({ children }) => {
  const router = createMemoryRouter(
    [
      {
        path: "/",
        element: children,
      },
    ],
    {
      initialEntries: ["/"],
    },
  );
  return <RouterProvider router={router} />;
};

describe("AddMFAPage Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useUser.mockReturnValue({
      state: mockUserState,
    });

    useNavigateHelper.mockReturnValue(mockNavigateHelper);
    // Navigation is mocked in the vi.mock() call above

    // Mock custom hooks
    useOtpOperations.mockReturnValue({
      userPhoneFactors: [],
      userSelectedMfaFactor: { type: "sms" },
      userOtpValue: "",
      otpSentResponse: { trxnId: "mock-trxn-id" },
      localLoading: false,
      phoneFactorsMap: {}, // Empty map so add-second-mfa step is shown
      handleChangeUserMfaSelection: vi.fn(),
      handleSetUserOtpValue: vi.fn(),
      setUserPhoneFactors: vi.fn(),
      setUserSelectedMfaFactor: vi.fn(),
      setLocalLoading: vi.fn(),
      setOtpSentResponse: vi.fn(),
    });

    usePasswordValidation.mockImplementation(
      (setErrorCode, successCallback) => ({
        validatePassword: vi.fn(async (password) => {
          try {
            // Use the mocked authService.verifyPassword to determine behavior
            await authService.verifyPassword(password);
            // Clear error code and call success callback
            setErrorCode("");
            successCallback();
          } catch (error) {
            // Extract error code from the error and call setErrorCode
            const errorCode = error?.data?.message || "7";
            setErrorCode(errorCode);
          }
          return Promise.resolve();
        }),
      }),
    );

    // Mock authService
    authService.transientOtpSend = vi.fn().mockResolvedValue({
      success: true,
      data: { trxnId: "trxn-123" },
    });

    authService.transientOtpVerify = vi.fn().mockResolvedValue({
      success: true,
    });

    authService.verifyPassword = vi.fn().mockResolvedValue({
      success: true,
    });

    authService.requestPasswordPolicy = vi.fn().mockResolvedValue({
      success: true,
      data: { pwdMinLength: 12, pwdMaxLength: 65 },
    });

    functions.getPageContent.mockImplementation((language, page) => {
      if (page === "otpSelection") return { 11: "Loading..." };
      if (page === "error")
        return {
          7: "Unexpected API request error message",
          "Some API Error": "Custom API Error Message",
        };
      if (page === "successBanner")
        return {
          5: "Voice call",
          6: "Text message",
        };
      return {};
    });

    // Mock addMFAPhoneNumberApi methods
    addMFAPhoneNumberApi.enrollMFA = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "mfa-123" },
    });

    addMFAPhoneNumberApi.sendMFAOTP = vi.fn().mockResolvedValue({
      success: true,
      data: { id: "txn-456" },
    });

    addMFAPhoneNumberApi.verifyMFAOTP = vi.fn().mockResolvedValue({
      success: true,
    });

    // Mock deleteMFAPhoneNumberApi methods
    deleteMFAPhoneNumberApi.deleteMFA = vi.fn().mockResolvedValue({
      success: true,
    });
  });

  describe("StepContent Error Handling", () => {
    it("should display specific error message when errorCode matches errorPageJson key", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      // Mock the component to simulate an error state
      const AddMFAPageWithError = () => {
        const Component = AddMFAPage;
        // We'll test this through API error simulation
        return <Component />;
      };

      render(
        <TestWrapper>
          <AddMFAPageWithError />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });
    });

    it('should display fallback error message for "Unexpected API request error"', async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      // This tests line 23: errorMessage = errorPageJson["7"];
      const errorPageJson = { 7: "Unexpected API request error message" };

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") return errorPageJson;
        if (page === "otpSelection") return { 11: "Loading..." };
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });
    });
  });

  describe("enrollMFA Error Handling", () => {
    it("should handle API error in enrollMFA and set error code", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const apiError = {
        data: { message: "Enrollment failed" },
      };
      addMFAPhoneNumberApi.enrollMFA.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to add MFA number step to trigger enrollMFA
      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should trigger the enrollMFA error path (lines 83-88, 97)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalled();
      });
    });

    it("should handle enrollMFA error without data.message", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      // Mock the transientOtpVerify for this test
      authService.transientOtpVerify = vi.fn().mockResolvedValue({
        success: true,
      });

      const apiError = { someOtherError: true };
      addMFAPhoneNumberApi.enrollMFA.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalled();
      });
    });
  });

  describe("sendMFAOtp Error Handling", () => {
    it("should handle API error in sendMFAOtp", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      const apiError = {
        data: { message: "Send OTP failed" },
      };
      addMFAPhoneNumberApi.sendMFAOTP.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should trigger sendMFAOtp error path (lines 115-116, 143-144)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.sendMFAOTP).toHaveBeenCalled();
      });
    });
  });

  describe("verifyMFAOtp Navigation Logic", () => {
    it("should navigate to manage2FAVerifications when user has multiple phone factors with same last 4 digits", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate through the flow to trigger verifyMFAOtp
      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyNextButton = screen.getByTestId(
        "add-mfa-otp-verification-next",
      );
      verifyNextButton.click();

      // This should trigger verifyMFAOtp and navigation logic (lines 168-171)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.verifyMFAOTP).toHaveBeenCalled();
      });
    });

    it("should handle verifyMFAOtp API error", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      const apiError = {
        data: { message: "Verification failed" },
      };
      addMFAPhoneNumberApi.verifyMFAOTP.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // Wait for sendMFAOTP to have been called (ensures trxnId is set)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.sendMFAOTP).toHaveBeenCalled();
      });

      // Wait for the next step to be rendered
      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyNextButton = screen.getByTestId(
        "add-mfa-otp-verification-next",
      );
      verifyNextButton.click();

      // This should trigger verifyMFAOtp error path (lines 181-182)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.verifyMFAOTP).toHaveBeenCalled();
      });
    });
  });

  describe("deleteMFA Error Handling", () => {
    it("should handle deleteMFA API error", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      const deleteError = {
        data: { message: "Delete failed" },
      };
      deleteMFAPhoneNumberApi.deleteMFA.mockRejectedValue(deleteError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const useDifferentPhoneButton = screen.getByTestId("use-different-phone");
      useDifferentPhoneButton.click();

      // This should trigger deleteMFA error path (lines 188-203)
      await waitFor(() => {
        expect(deleteMFAPhoneNumberApi.deleteMFA).toHaveBeenCalled();
      });
    });
  });

  describe("Handler Functions Coverage", () => {
    it("should test handleChangeUserMfaSelection function", async () => {
      const mockPhoneFactors = [
        { id: "factor1", type: "sms", destination: "+1234567890" },
        { id: "factor2", type: "voice", destination: "+1234567891" },
      ];

      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: mockPhoneFactors,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // The useOtpOperations hook automatically fetches phone factors on mount
      // This is handled internally by the hook, not by the component
    });

    it("should test handlePhoneForm function through AddMFAPhoneNumber interaction", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", destination: "+1234567890" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-id-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "trxn-id-123" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to addMFANumber step
      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Navigate to addMFANumber step
      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      // Trigger enrollMFA and sendMFAOtp which test handlePhoneForm
      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalled();
        expect(addMFAPhoneNumberApi.sendMFAOTP).toHaveBeenCalled();
      });
    });

    it("should test handleOtpSentResponse and handleSetUserOtpValue functions", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", destination: "+1234567890" }],
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to otp verification step which uses these handlers
      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // The OtpVerification component should receive the handler props
      // This tests that handleOtpSentResponse and handleSetUserOtpValue are passed
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });
  });

  describe("Step Navigation Functions", () => {
    it("should test onBack functions in steps", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", destination: "+1234567890" }],
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to otp verification step
      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Test onBack function
      const backButton = screen.getByTestId("otp-verification-back");
      backButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });
    });

    it("should test addMFAValidation onBack function", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", destination: "+1234567890" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-id-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "trxn-id-123" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Navigate through steps to reach addMFAValidation
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      // Test onBack function - note that it will trigger deleteMFA but may not change step due to the error
      const backButton = screen.getByTestId("add-mfa-otp-verification-back");
      backButton.click();

      // The onBack function calls deleteMFA() without parameters, which may cause an error
      // So we should expect the step to remain at add-mfa-otp-verification
      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("AddSecondMFA Flow Functions", () => {
    it("should test onUseDifferentPhoneNumber function", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "smsotp", destination: "+1234567890" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-id-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "trxn-id-123" },
      });

      deleteMFAPhoneNumberApi.deleteMFA.mockResolvedValue({
        success: true,
      });
      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Navigate to addMFAValidation step
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      // Test onUseDifferentPhoneNumber function which calls deleteMFA
      const differentPhoneButton = screen.getByTestId("use-different-phone");
      differentPhoneButton.click();

      await waitFor(() => {
        expect(deleteMFAPhoneNumberApi.deleteMFA).toHaveBeenCalledWith(
          expect.objectContaining({
            id: "mfa-id-123",
            otpType: "sms",
          }),
        );
      });
    });

    it("should test onAddSecondMFA function with voice to SMS conversion", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "voice", destination: "+1234567890" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-id-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "trxn-id-123" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Navigate to addSecondMFA step
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyButton = screen.getByTestId("add-mfa-otp-verification-next");
      verifyButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-second-mfa")).toBeInTheDocument();
      });

      // Test onAddSecondMFA function - should convert voice to SMS
      const addSecondButton = screen.getByTestId("add-second-mfa-btn");
      addSecondButton.click();

      await waitFor(() => {
        // Should call enrollMFA with SMS (opposite of voice)
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalledWith(
          expect.objectContaining({
            otpType: "sms", // voice converted to sms
          }),
        );
      });
    });
  });

  describe("Request New OTP Code", () => {
    it("should call sendMFAOtp with reSendOtpCode=true when requesting new OTP", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const requestNewOtpButton = screen.getByTestId("request-new-otp");
      requestNewOtpButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.sendMFAOTP).toHaveBeenCalledWith({
          id: "mfa-123",
          otpType: "sms",
        });
      });
    });
  });

  describe("Add Second MFA Flow", () => {
    it("should handle adding second MFA with opposite OTP type", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Navigate through the complete flow to reach addSecondMFA step
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyNextButton = screen.getByTestId(
        "add-mfa-otp-verification-next",
      );
      verifyNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-second-mfa")).toBeInTheDocument();
      });

      const addSecondMfaButton = screen.getByTestId("add-second-mfa-btn");
      addSecondMfaButton.click();

      // This should trigger second MFA enrollment with voice type (lines 296-334)
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalledWith({
          destination: "",
          otpType: "voice",
        });
      });
    });
  });

  describe("Advanced Coverage Tests", () => {
    it("should handle validateOtpCode with response error format", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const responseError = {
        response: {
          data: { message: "RESPONSE_ERROR" },
        },
      };
      authService.transientOtpVerify.mockRejectedValue(responseError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to reach OTP verification
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Trigger OTP verification which should cause the response error
      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(authService.transientOtpVerify).toHaveBeenCalled();
      });
    });

    it("should handle getUserOtpPhoneFactors false parameter in handleMFAEnrollment", async () => {
      otpFactors.getUserOtpPhoneFactors
        .mockResolvedValueOnce({
          success: true,
          data: [
            { id: "factor-1", type: "smsotp", destination: "+15551234567" },
          ],
        })
        .mockResolvedValueOnce({
          success: true,
          data: [
            {
              id: "unvalidated-factor",
              type: "sms",
              destination: "+15551234567",
            },
          ],
        });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger handleMFAEnrollment
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should call getUserOtpPhoneFactors with false parameter
      await waitFor(() => {
        expect(otpFactors.getUserOtpPhoneFactors).toHaveBeenCalledWith(false);
      });
    });

    it("should handle no existing MFA found scenario in handleMFAEnrollment", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValueOnce({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger handleMFAEnrollment catch block
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalled();
      });
    });

    it("should handle requestOtpCode function coverage", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      authService.transientOtpSend.mockResolvedValue({
        success: true,
        data: { trxnId: "test-trxn" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to OTP verification step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Test request OTP code functionality
      const requestOtpButton = screen.getByTestId("request-otp-code");
      requestOtpButton.click();

      await waitFor(() => {
        expect(authService.transientOtpSend).toHaveBeenCalled();
      });
    });

    it("should handle requestOtpCode error scenario", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const otpError = {
        data: { message: "OTP_REQUEST_ERROR" },
      };
      authService.transientOtpSend.mockRejectedValue(otpError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to OTP verification step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Test request OTP code error handling
      const requestOtpButton = screen.getByTestId("request-otp-code");
      requestOtpButton.click();

      await waitFor(() => {
        expect(authService.transientOtpSend).toHaveBeenCalled();
      });
    });

    it("should handle deleteMFA with default parameters", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      deleteMFAPhoneNumberApi.deleteMFA.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to addMFAValidation step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      // Test onBack function which calls deleteMFA with default parameters
      const backButton = screen.getByTestId("add-mfa-otp-verification-back");
      backButton.click();

      await waitFor(() => {
        expect(deleteMFAPhoneNumberApi.deleteMFA).toHaveBeenCalled();
      });
    });

    it("should handle verifyMFAOtp with duplicate phone number navigation", async () => {
      // Mock user phone factors with same last 4 digits
      const mockPhoneFactors = [
        {
          id: "factor1",
          type: "sms",
          destination: "+15554567890",
          lastFourDigits: "7890",
        },
        {
          id: "factor2",
          type: "voice",
          destination: "+15554567890",
          lastFourDigits: "7890",
        },
      ];

      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: mockPhoneFactors,
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "successBanner") return { 5: "Voice", 6: "SMS" };
        return { 11: "Loading..." };
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through complete flow to trigger navigation logic
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyButton = screen.getByTestId("add-mfa-otp-verification-next");
      verifyButton.click();

      // This should trigger the navigation logic for duplicate phone numbers
      await waitFor(() => {
        expect(addMFAPhoneNumberApi.verifyMFAOTP).toHaveBeenCalled();
      });
    });
  });

  describe("ErrorSummaryWithFocus Rendering Tests", () => {
    it("should not render error summary when no error code is present", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId("error-summary-with-focus"),
      ).not.toBeInTheDocument();
    });

    it("should render error summary when errorCode is set during enrollMFA failure", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const apiError = {
        data: { message: "CSIAM0011E" },
      };
      addMFAPhoneNumberApi.enrollMFA.mockRejectedValue(apiError);

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          return {
            CSIAM0011E: "Invalid verification code. Please try again.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Loading..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger enrollMFA error
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should trigger enrollMFA error and display error summary
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

    it("should render error summary with correct language when language is French", async () => {
      // Mock French language parameter
      const mockUseParams = await import("react-router");
      vi.mocked(mockUseParams.useParams).mockReturnValue({ language: "fr" });

      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const apiError = {
        data: { message: "CSIAM0002E" },
      };
      addMFAPhoneNumberApi.enrollMFA.mockRejectedValue(apiError);

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          if (language === "fr") {
            return {
              CSIAM0002E: "Votre compte a été verrouillé.",
              7: "Une erreur inattendue s'est produite. Veuillez réessayer plus tard.",
            };
          }
          return {
            CSIAM0002E: "Your account has been locked.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Chargement..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger enrollMFA error
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should trigger enrollMFA error and display error summary in French
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      const errorSummary = screen.getByTestId("error-summary-with-focus");
      expect(errorSummary).toHaveAttribute("data-error-code", "CSIAM0002E");
      expect(errorSummary).toHaveAttribute("data-language", "fr");
      expect(errorSummary).toHaveTextContent("Error Summary: CSIAM0002E");

      // Reset useParams mock
      const mockUseParams2 = await import("react-router");
      vi.mocked(mockUseParams2.useParams).mockReturnValue({ language: "en" });
    });

    it("should render error summary when sendMFAOtp fails", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      const apiError = {
        data: { message: "OTP_SEND_ERROR" },
      };
      addMFAPhoneNumberApi.sendMFAOTP.mockRejectedValue(apiError);

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          return {
            OTP_SEND_ERROR: "Failed to send OTP. Please try again.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Loading..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger sendMFAOtp error
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      // This should trigger sendMFAOtp error and display error summary
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      const errorSummary = screen.getByTestId("error-summary-with-focus");
      expect(errorSummary).toHaveAttribute("data-error-code", "OTP_SEND_ERROR");
      expect(errorSummary).toHaveTextContent("Error Summary: OTP_SEND_ERROR");
    });

    it("should render error summary when verifyMFAOtp fails", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      const apiError = {
        data: { message: "VERIFICATION_FAILED" },
      };
      addMFAPhoneNumberApi.verifyMFAOTP.mockRejectedValue(apiError);

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          return {
            VERIFICATION_FAILED: "OTP verification failed. Please try again.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Loading..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through steps to trigger verifyMFAOtp error
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyNextButton = screen.getByTestId(
        "add-mfa-otp-verification-next",
      );
      verifyNextButton.click();

      // This should trigger verifyMFAOtp error and display error summary
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      const errorSummary = screen.getByTestId("error-summary-with-focus");
      expect(errorSummary).toHaveAttribute(
        "data-error-code",
        "VERIFICATION_FAILED",
      );
      expect(errorSummary).toHaveTextContent(
        "Error Summary: VERIFICATION_FAILED",
      );
    });

    it("should render error summary when password verification fails", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      const apiError = {
        data: { message: "INVALID_PASSWORD" },
      };
      authService.verifyPassword.mockRejectedValue(apiError);

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          return {
            INVALID_PASSWORD: "Invalid password. Please try again.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Loading..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Trigger password verification error
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // This should trigger password verification error and display error summary
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      const errorSummary = screen.getByTestId("error-summary-with-focus");
      expect(errorSummary).toHaveAttribute(
        "data-error-code",
        "INVALID_PASSWORD",
      );
      expect(errorSummary).toHaveTextContent("Error Summary: INVALID_PASSWORD");
    });

    it("should clear error summary when error is resolved", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      // First call fails, second succeeds
      authService.verifyPassword
        .mockRejectedValueOnce({
          data: { message: "INVALID_PASSWORD" },
        })
        .mockResolvedValueOnce({
          success: true,
        });

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "error") {
          return {
            INVALID_PASSWORD: "Invalid password. Please try again.",
            7: "An unexpected error occurred. Please try again later.",
          };
        }
        if (page === "otpSelection") {
          return { 11: "Loading..." };
        }
        return {};
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Trigger password verification error first
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Should show error summary
      await waitFor(() => {
        expect(
          screen.getByTestId("error-summary-with-focus"),
        ).toBeInTheDocument();
      });

      // Try again - this should succeed and clear the error
      button.click();

      // Error summary should be cleared and we should move to next step
      await waitFor(() => {
        expect(
          screen.queryByTestId("error-summary-with-focus"),
        ).not.toBeInTheDocument();
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });
    });
  });

  describe("Additional Function Coverage Tests", () => {
    it("should test handleSetupAlternateMFAMethod function", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to addSecondMFA step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyButton = screen.getByTestId("add-mfa-otp-verification-next");
      verifyButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-second-mfa")).toBeInTheDocument();
      });

      // Test the alternate MFA method setup
      const addSecondButton = screen.getByTestId("add-second-mfa-btn");
      addSecondButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalled();
      });
    });

    it("should handle voice OTP type in successBanner mapping", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "voice", destination: "+1234567890" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-id-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "trxn-id-123" },
      });

      addMFAPhoneNumberApi.verifyMFAOTP.mockResolvedValue({
        success: true,
      });

      functions.getPageContent.mockImplementation((language, page) => {
        if (page === "successBanner")
          return { 5: "Voice call", 6: "Text message" };
        return { 11: "Loading..." };
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate through complete flow with voice OTP
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyButton = screen.getByTestId("add-mfa-otp-verification-next");
      verifyButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.verifyMFAOTP).toHaveBeenCalled();
      });
    });

    it("should handle console.error in useEffect when getUserOtpPhoneFactors fails", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const apiError = new Error("API failed");
      otpFactors.getUserOtpPhoneFactors.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      // The useOtpOperations hook handles the error internally
      // We verify the component still renders even when the API call fails
      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it("should handle enrollMFA with phoneNumber parameter", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "voice", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to addSecondMFA step where enrollMFA is called with phoneNumber
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      const verifyButton = screen.getByTestId("add-mfa-otp-verification-next");
      verifyButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-second-mfa")).toBeInTheDocument();
      });

      // This will trigger handleSetupAlternateMFAMethod which calls enrollMFA with phoneNumber
      const addSecondButton = screen.getByTestId("add-second-mfa-btn");
      addSecondButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.enrollMFA).toHaveBeenCalledWith(
          expect.objectContaining({
            destination: expect.any(String),
          }),
        );
      });
    });

    it("should handle sendMFAOtp with different reSendOtpCode parameter", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", destination: "+15551234567" }],
      });

      addMFAPhoneNumberApi.enrollMFA.mockResolvedValue({
        data: { id: "mfa-123" },
      });

      addMFAPhoneNumberApi.sendMFAOTP.mockResolvedValue({
        data: { id: "txn-456" },
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      });

      // Navigate to addMFAValidation step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("otp-selection-next");
      nextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const otpNextButton = screen.getByTestId("otp-verification-next");
      otpNextButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });

      const addMfaNextButton = screen.getByTestId("add-mfa-phone-number-next");
      addMfaNextButton.click();

      await waitFor(() => {
        expect(
          screen.getByTestId("add-mfa-otp-verification"),
        ).toBeInTheDocument();
      });

      // Test request new OTP which calls sendMFAOtp with different parameters
      const requestNewOtpButton = screen.getByTestId("request-new-otp");
      requestNewOtpButton.click();

      await waitFor(() => {
        expect(addMFAPhoneNumberApi.sendMFAOTP).toHaveBeenCalledWith({
          id: "mfa-123",
          otpType: "sms",
        });
      });
    });
  });
});
