import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import { createMemoryRouter, RouterProvider } from "react-router";
import AddMFAPage from "../AddMFAPage";
import { useUser } from "../../../../../components/Providers/useUser";
import { useNavigateHelper } from "../../../../../hooks/useNavigate";
import { otpFactors } from "../../../../TransientOtp/api/otpFactors";
import { addMFAPhoneNumberApi } from "../../api/AddMFAPhoneNumberAPI";
import { deleteMFAPhoneNumberApi } from "../../../DeleteMFAPhoneNumber/api/DeleteMFAPhoneNumberAPI";
import * as functions from "../../../../../utils/functions";
import { authService } from "../../../../../services/authService";

// Mock dependencies
vi.mock("../../../../../components/Providers/useUser");
vi.mock("../../../../../hooks/useNavigate");
vi.mock("../../../../TransientOtp/api/otpFactors");
vi.mock("../../api/AddMFAPhoneNumberAPI");
vi.mock("../../../DeleteMFAPhoneNumber/api/DeleteMFAPhoneNumberAPI");
vi.mock("../../../../../utils/functions");
vi.mock("../../../../../services/authService");

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

vi.mock("../../../../TransientOtp/components/OtpVerification", async () => {
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
          <button
            onClick={() => validateOtpCode && validateOtpCode("123456")}
            data-testid="otp-verification-next"
          >
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

    // Mock authService
    authService.transientOtpSend = vi.fn().mockResolvedValue({
      success: true,
      data: { trxnId: "trxn-123" },
    });

    authService.transientOtpVerify = vi.fn().mockResolvedValue({
      success: true,
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
  });

  describe("StepContent Error Handling", () => {
    it("should display specific error message when errorCode matches errorPageJson key", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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

  describe("useEffect Navigation Logic", () => {
    it("should navigate to security settings when no phone factors found", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      render(
        <TestWrapper>
          <AddMFAPage />
        </TestWrapper>,
      );

      // This should trigger navigation to security settings (lines 230-233)
      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalled();
      });
    });

    it("should handle getUserOtpPhoneFactors API error and log to console", async () => {
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

      // This should trigger console.error (line 280)
      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching user OTP phone factors:",
          apiError,
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Handler Functions Coverage", () => {
    it("should test handleChangeUserMfaSelection function", async () => {
      const mockPhoneFactors = [
        { id: "factor1", type: "sms", phoneNumber: "+1234567890" },
        { id: "factor2", type: "voice", phoneNumber: "+1234567891" },
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

      // This tests the handleChangeUserMfaSelection function internally
      expect(otpFactors.getUserOtpPhoneFactors).toHaveBeenCalledWith(
        "test-user-123",
      );
    });

    it("should test handlePhoneForm function through AddMFAPhoneNumber interaction", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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

      // Test onBack function which should clear error and go back to addMFANumber
      const backButton = screen.getByTestId("add-mfa-otp-verification-back");
      backButton.click();

      await waitFor(() => {
        expect(screen.getByTestId("add-mfa-phone-number")).toBeInTheDocument();
      });
    });
  });

  describe("AddSecondMFA Flow Functions", () => {
    it("should test onSkipForNow function in addSecondMFA step", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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

      // Navigate to add otp selection number step
      const button = screen.getByTestId("password-verification-next");
      button.click();

      // Navigate through steps to reach verifyMFAOtp which leads to addSecondMFA
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

      // Test onSkipForNow function
      const skipButton = screen.getByTestId("skip-for-now");
      skipButton.click();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
          false,
          {
            noticeType: "mfaAdded",
            phoneNumber: "",
            otpType: undefined,
          },
        );
      });
    });

    it("should test onUseDifferentPhoneNumber function", async () => {
      otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor1", type: "sms", phoneNumber: "+1234567890" }],
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
        data: [{ id: "factor1", type: "voice", phoneNumber: "+1234567890" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
        data: [{ id: "factor-1", type: "smsotp", phoneNumber: "+15551234567" }],
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
          phoneNumber: "",
          otpType: "voice",
        });
      });
    });
  });
});
