import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import React from "react";
import EditEmailAddressPage from "../EditEmailAddressPage";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../hooks/useOtpOperations";

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn(),
}));

vi.mock("../../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({ trackEvent: mockTrackEvent }),
}));

vi.mock("../../../hooks/useWizardPageTracking", () => ({
  useWizardPageTracking: vi.fn(),
}));

// Setup test environment for GCDS components
import "../../../setupTests";

// Extend expect with jest-dom matchers
import "@testing-library/jest-dom";

// Mock only what's necessary for integration testing
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

vi.mock("../../../components/Wizard/StepContent", () => ({
  default: ({ StepComponent }) => (
    <div data-testid="step-content">{StepComponent}</div>
  ),
}));

// Mock the step components to be interactive
vi.mock("../../TransientOtp/components/PasswordVerification", () => ({
  default: ({ validatePassword, onCancel, setErrorCode }) => (
    <div data-testid="password-verification">
      <button
        onClick={() => {
          setErrorCode("");
          validatePassword();
        }}
        data-testid="validate-password-btn"
      >
        Validate Password
      </button>
      <button onClick={onCancel} data-testid="cancel-password-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext, onCancel }) => (
    <div data-testid="otp-selection">
      <button onClick={onNext} data-testid="otp-next-btn">
        Next
      </button>
      <button onClick={onCancel} data-testid="otp-cancel-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../TransientOtp/components/OtpVerification", () => ({
  default: ({ validateOtpCode, onBack, onCancel }) => (
    <div data-testid="otp-verification">
      <button onClick={validateOtpCode} data-testid="verify-otp-btn">
        Verify OTP
      </button>
      <button onClick={onBack} data-testid="otp-back-btn">
        Back
      </button>
      <button onClick={onCancel} data-testid="otp-cancel-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../EditEmailEnterEmail", () => ({
  default: ({ onSubmit, onCancel, handleFormChange, formData }) => (
    <div data-testid="edit-email-enter-email">
      <input
        type="email"
        name="emailAddress"
        value={formData.emailAddress}
        onChange={handleFormChange}
        data-testid="email-input"
      />
      <button onClick={onSubmit} data-testid="submit-email-btn">
        Submit Email
      </button>
      <button onClick={onCancel} data-testid="cancel-email-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../EmailOtpValidation", () => ({
  default: ({ onSubmit, onCancel, onBack, requestOtpCode }) => (
    <div data-testid="email-otp-validation">
      <button onClick={requestOtpCode} data-testid="request-otp-btn">
        Request OTP
      </button>
      <button onClick={onSubmit} data-testid="submit-email-otp-btn">
        Submit OTP
      </button>
      <button onClick={onBack} data-testid="back-email-otp-btn">
        Back
      </button>
      <button onClick={onCancel} data-testid="cancel-email-otp-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../EmailConfirmUpdate", () => ({
  default: ({ onSubmit, onCancel, formData }) => (
    <div data-testid="email-confirm-update">
      <span data-testid="confirm-email">{formData.emailAddress}</span>
      <button onClick={onSubmit} data-testid="confirm-update-btn">
        Confirm Update
      </button>
      <button onClick={onCancel} data-testid="cancel-confirm-btn">
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../EmailUpdateSuccess", () => ({
  default: ({ newEmailAddress, onBackToProfile, onSignOut }) => (
    <div data-testid="email-update-success">
      <span data-testid="success-email">{newEmailAddress}</span>
      <button onClick={onBackToProfile} data-testid="back-to-profile-btn">
        Back to Profile
      </button>
      <button onClick={onSignOut} data-testid="sign-out-btn">
        Sign Out
      </button>
    </div>
  ),
}));

// Mock hooks with real-like behavior
vi.mock("../../../hooks/usePasswordValidation", () => ({
  usePasswordValidation: vi.fn((setErrorCode, onSuccess) => ({
    validatePassword: () => {
      setErrorCode("");
      onSuccess();
    },
    validatePasswordLoading: false,
  })),
}));

vi.mock("../../../hooks/useOtpOperations", () => ({
  useOtpOperations: vi.fn(() => ({
    userPhoneFactors: [
      { id: "phone1", value: "+1234567890", type: "sms" },
      { id: "phone2", value: "+1234567891", type: "voice" },
    ],
    userSelectedMfaFactor: null,
    userOtpValue: "123456",
    otpSentResponse: { trxnId: "mock-transaction-id" },
    otpLoading: false,
    handleChangeUserMfaSelection: vi.fn(),
    handleSetUserOtpValue: vi.fn(),
    requestOtpCode: vi.fn().mockResolvedValue(true),
    validateOtpCode: vi.fn((otpValue, callback) => {
      if (callback) {
        callback({ success: true });
      }
    }),
    setOtpLoading: vi.fn(),
  })),
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        id: "test-user-id",
        userName: "test@example.com",
        emails: [{ type: "work", value: "test@example.com" }],
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../services/authService", () => ({
  authService: {
    logout: vi.fn().mockResolvedValue({
      data: { redirect_url: "https://logout.example.com" },
    }),
    update_email_with_otp: vi.fn().mockResolvedValue({
      success: true,
      data: { userName: "updated@example.com" },
    }),
  },
}));

vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: vi.fn(),
  }),
}));

vi.mock("../../../utils/functions", () => ({
  getPageContent: () => ({ 11: "Loading..." }),
}));

vi.mock("../../../utils/errorUtils", () => ({
  getErrorMessage: (lang, code) => code || "",
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: () => "/en/profile",
}));

describe("EditEmailAddressPage Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.location for logout tests
    delete window.location;
    window.location = { href: "" };
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EditEmailAddressPage />
      </BrowserRouter>,
    );
  };

  describe("Real Function Execution", () => {
    it("executes handleFormChange with regular input event", async () => {
      renderComponent();

      // Navigate to enter email step first
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });

      // Now test form change
      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "new@example.com" } });
      });

      expect(emailInput.value).toBe("new@example.com");
    });

    it("executes handleEnterEmailSubmit with empty email", async () => {
      renderComponent();

      // Navigate to enter email step
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });

      // Try to submit empty email
      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      // Should still be on enter email step due to validation error
      expect(screen.getByTestId("edit-email-enter-email")).toBeInTheDocument();
    });

    it("executes handleEnterEmailSubmit with invalid email format", async () => {
      renderComponent();

      // Navigate to enter email step
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });

      // Enter invalid email
      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "invalid-email" } });
      });

      // Try to submit
      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      // Should still be on enter email step due to validation error
      expect(screen.getByTestId("edit-email-enter-email")).toBeInTheDocument();
    });

    it("executes handleEnterEmailSubmit with valid email", async () => {
      renderComponent();

      // Navigate to enter email step
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });

      // Enter valid email
      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: "valid@example.com" },
        });
      });

      // Submit valid email
      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      // Should navigate to email OTP validation
      await waitFor(() => {
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument();
      });
    });

    it("executes handleBackToEnterEmail navigation", async () => {
      renderComponent();

      // Navigate through multiple steps to email OTP validation
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      });

      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument();
      });

      // Click back button to go to enter email
      await act(async () => {
        const backBtn = screen.getByTestId("back-email-otp-btn");
        fireEvent.click(backBtn);
      });

      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });
    });

    it("executes complete wizard flow to success", async () => {
      renderComponent();

      // Step 1: Password verification
      expect(screen.getByTestId("password-verification")).toBeInTheDocument();

      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      // Step 2: OTP Selection
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      // Step 3: OTP Verification
      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      // Step 4: Enter Email
      await waitFor(() => {
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument();
      });

      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: "updated@example.com" },
        });
      });

      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      // Step 5: Email OTP Validation
      await waitFor(() => {
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument();
      });

      await act(async () => {
        const submitOtpBtn = screen.getByTestId("submit-email-otp-btn");
        fireEvent.click(submitOtpBtn);
      });

      // Step 6: Confirm Update
      await waitFor(() => {
        expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument();
      });

      expect(screen.getByTestId("confirm-email")).toHaveTextContent(
        "updated@example.com",
      );

      await act(async () => {
        const confirmBtn = screen.getByTestId("confirm-update-btn");
        fireEvent.click(confirmBtn);
      });

      // Step 7: Success
      await waitFor(() => {
        expect(screen.getByTestId("email-update-success")).toBeInTheDocument();
      });

      expect(screen.getByTestId("success-email")).toHaveTextContent(
        "updated@example.com",
      );
    });

    it("executes handleSignOut functionality", async () => {
      renderComponent();

      // Navigate to success step
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: "success@example.com" },
        });
      });

      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      await act(async () => {
        const submitOtpBtn = screen.getByTestId("submit-email-otp-btn");
        fireEvent.click(submitOtpBtn);
      });

      await act(async () => {
        const confirmBtn = screen.getByTestId("confirm-update-btn");
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("email-update-success")).toBeInTheDocument();
      });

      // Click sign out
      await act(async () => {
        const signOutBtn = screen.getByTestId("sign-out-btn");
        fireEvent.click(signOutBtn);
      });

      // Since POST is being used, no more redirect is correct logic
      expect(window.location.href).toBe("");
    });
  });

  describe("Error Handling Integration", () => {
    it("handles API errors in handleEmailChange", async () => {
      const { authService } = await import("../../../services/authService");
      authService.update_email_with_otp.mockRejectedValue({
        data: { message: "EMAIL_UPDATE_FAILED" },
      });

      renderComponent();

      // Navigate to confirm step
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: "error@example.com" },
        });
      });

      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      await act(async () => {
        const submitOtpBtn = screen.getByTestId("submit-email-otp-btn");
        fireEvent.click(submitOtpBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument();
      });

      // This should trigger handleEmailChange with error
      await act(async () => {
        const confirmBtn = screen.getByTestId("confirm-update-btn");
        fireEvent.click(confirmBtn);
      });

      // Should stay on confirm page due to error
      expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument();
    });

    it("handles logout errors in handleSignOut", async () => {
      const { authService } = await import("../../../services/authService");
      authService.logout.mockRejectedValue(new Error("Logout failed"));

      renderComponent();

      // Navigate to success and trigger sign out
      await act(async () => {
        const validateBtn = screen.getByTestId("validate-password-btn");
        fireEvent.click(validateBtn);
      });

      await act(async () => {
        const nextBtn = screen.getByTestId("otp-next-btn");
        fireEvent.click(nextBtn);
      });

      await act(async () => {
        const verifyBtn = screen.getByTestId("verify-otp-btn");
        fireEvent.click(verifyBtn);
      });

      const emailInput = screen.getByTestId("email-input");
      await act(async () => {
        fireEvent.change(emailInput, {
          target: { value: "error@example.com" },
        });
      });

      await act(async () => {
        const submitBtn = screen.getByTestId("submit-email-btn");
        fireEvent.click(submitBtn);
      });

      await act(async () => {
        const submitOtpBtn = screen.getByTestId("submit-email-otp-btn");
        fireEvent.click(submitOtpBtn);
      });

      // Mock successful update for this test
      authService.update_email_with_otp.mockResolvedValue({
        success: true,
        data: { userName: "updated@example.com" },
      });

      await act(async () => {
        const confirmBtn = screen.getByTestId("confirm-update-btn");
        fireEvent.click(confirmBtn);
      });

      await waitFor(() => {
        expect(screen.getByTestId("email-update-success")).toBeInTheDocument();
      });

      // This should trigger handleSignOut with error - test that it doesn't crash
      await act(async () => {
        const signOutBtn = screen.getByTestId("sign-out-btn");
        fireEvent.click(signOutBtn);
      });

      // The component should handle the error gracefully
      // We can't easily test setTimeout behavior without causing timing issues
      expect(screen.getByTestId("email-update-success")).toBeInTheDocument();
    });
  });

  describe("GA Error Tracking", () => {
    beforeEach(() => {
      // Reset useOtpOperations to the default callback-based implementation before each GA test
      vi.mocked(useOtpOperations).mockImplementation(() => ({
        userPhoneFactors: [
          { id: "phone1", value: "+1234567890", type: "sms" },
          { id: "phone2", value: "+1234567891", type: "voice" },
        ],
        userSelectedMfaFactor: { id: "phone1", type: "sms" },
        userOtpValue: "123456",
        otpSentResponse: { trxnId: "mock-transaction-id" },
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn((otpValue, callback) => {
          if (callback) {
            callback({ success: true });
          }
        }),
        setOtpLoading: vi.fn(),
      }));
    });

    it("emits form_step_end error event when password verify API fails", async () => {
      let capturedOnError;
      vi.mocked(usePasswordValidation).mockImplementationOnce(
        (_setErr, _onSuccess, _useStepup, onError) => {
          capturedOnError = onError;
          return { validatePassword: vi.fn(), validatePasswordLoading: false };
        },
      );

      renderComponent();

      await act(async () => {
        capturedOnError?.("WRONG_PASSWORD");
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "email_update_verify_password",
        error: "WRONG_PASSWORD",
      });
    });

    it("emits form_step_end error event when OTP verify API fails", async () => {
      // Override validateOtpCode to immediately invoke the onError callback
      vi.mocked(useOtpOperations).mockImplementation(() => ({
        userPhoneFactors: [
          { id: "phone1", value: "+1234567890", type: "sms" },
          { id: "phone2", value: "+1234567891", type: "voice" },
        ],
        userSelectedMfaFactor: { id: "phone1", type: "sms" },
        userOtpValue: "123456",
        otpSentResponse: { trxnId: "mock-transaction-id" },
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn((_otp, _onSuccess, _override, onError) => {
          onError?.("INVALID_OTP_CODE");
        }),
        setOtpLoading: vi.fn(),
      }));

      renderComponent();

      // Advance past password verification
      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      // 2 phone factors → OTP selection step is shown
      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Advance past OTP selection
      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });

      // OTP verification step is now shown
      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      // Click verify — triggers validateOtpCode which calls onError
      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "otp_validation",
        error: "INVALID_OTP_CODE",
      });
    });

    it("emits form_step_end with error when confirm_update API fails", async () => {
      const { authService } = await import("../../../services/authService");
      authService.update_email_with_otp.mockRejectedValueOnce({
        data: { message: "EMAIL_UPDATE_FAILED" },
      });

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });

      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-otp-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-update-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_end",
          step: "confirm_update",
          error: "EMAIL_UPDATE_FAILED",
        });
      });
    });

    it("emits form_step_end when logout API fails", async () => {
      const { authService } = await import("../../../services/authService");
      // Ensure update succeeds so we reach the success step
      authService.update_email_with_otp.mockResolvedValueOnce({
        success: true,
        data: { userName: "new@example.com" },
      });
      authService.logout.mockRejectedValueOnce(new Error("Logout failed"));

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });

      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-otp-btn"));
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-update-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("email-update-success")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("sign-out-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_end",
          step: "logout",
        });
      });
    });
  });

  describe("GA Success Path Tracking", () => {
    beforeEach(() => {
      vi.mocked(useOtpOperations).mockImplementation(() => ({
        userPhoneFactors: [
          { id: "phone1", value: "+1234567890", type: "sms" },
          { id: "phone2", value: "+1234567891", type: "voice" },
        ],
        userSelectedMfaFactor: { id: "phone1", type: "sms" },
        userOtpValue: "123456",
        otpSentResponse: { trxnId: "mock-transaction-id" },
        otpLoading: false,
        handleChangeUserMfaSelection: vi.fn(),
        handleSetUserOtpValue: vi.fn(),
        requestOtpCode: vi.fn().mockResolvedValue(true),
        validateOtpCode: vi.fn((otpValue, callback) => {
          if (callback) {
            callback({ success: true });
          }
        }),
        setOtpLoading: vi.fn(),
      }));
    });

    it("fires form_step_start at verify_password when password validation begins", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_start",
        step: "email_update_verify_password",
        flow: "email_address_update",
      });
    });

    it("fires form_step_change to otp_selection after password validates (2-factor)", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "otp_selection",
        });
      });
    });

    it("fires form_step_change to otp_validation after OTP factor is selected", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "otp_validation",
        });
      });
    });

    it("fires form_step_start and form_step_change to enter_email after OTP validation succeeds", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });

      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_start",
          step: "otp_validation",
          flow: "email_address_update",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "enter_email",
        });
      });
    });

    it("fires form_step_change to email_otp_validation after valid email is submitted", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });
      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "email_otp_validation",
        });
      });
    });

    it("fires form_step_start and form_step_change to confirm_update after email OTP submitted", async () => {
      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });
      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-otp-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_start",
          step: "email_otp_validation",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_change",
          step: "confirm_update",
        });
      });
    });

    it("fires form_submit, form_step_start, and form_submit_complete when email update succeeds", async () => {
      const { authService: svc } =
        await import("../../../services/authService");
      svc.update_email_with_otp.mockResolvedValueOnce({
        success: true,
        data: { userName: "new@example.com" },
      });

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });
      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-otp-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-update-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_submit",
          step: "confirm_update",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_start",
          step: "confirm_update",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_submit_complete",
          step: "email_update_success",
        });
      });
    });

    it("fires form_submit, form_step_start, and form_submit_complete at logout when sign-out succeeds", async () => {
      const { authService: svc } =
        await import("../../../services/authService");
      svc.update_email_with_otp.mockResolvedValueOnce({
        success: true,
        data: { userName: "new@example.com" },
      });
      svc.logout.mockResolvedValueOnce({
        data: { redirect_url: "https://logout.example.com" },
      });

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId("validate-password-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("otp-next-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("verify-otp-btn"));
      });
      await waitFor(() =>
        expect(
          screen.getByTestId("edit-email-enter-email"),
        ).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.change(screen.getByTestId("email-input"), {
          target: { value: "new@example.com" },
        });
      });
      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-otp-validation")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("submit-email-otp-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-confirm-update")).toBeInTheDocument(),
      );
      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-update-btn"));
      });
      await waitFor(() =>
        expect(screen.getByTestId("email-update-success")).toBeInTheDocument(),
      );

      await act(async () => {
        fireEvent.click(screen.getByTestId("sign-out-btn"));
      });

      await waitFor(() => {
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_submit",
          step: "logout",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_step_start",
          step: "logout",
        });
        expect(mockTrackEvent).toHaveBeenCalledWith({
          event: "form_submit_complete",
          step: "logout",
        });
      });
    });
  });
});
