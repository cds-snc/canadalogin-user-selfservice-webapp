import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import React from "react";
import EditEmailAddressPage from "../EditEmailAddressPage";

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
  usePasswordValidation: (setErrorCode, onSuccess) => ({
    validatePassword: () => {
      setErrorCode("");
      onSuccess();
    },
    validatePasswordLoading: false,
  }),
}));

vi.mock("../../../hooks/useOtpOperations", () => ({
  useOtpOperations: () => ({
    userPhoneFactors: [{ id: "phone1", value: "+1234567890" }],
    userSelectedMfaFactor: null,
    userOtpValue: "123456", // Provide a mock OTP value
    otpSentResponse: { trxnId: "mock-transaction-id" }, // Mock transaction ID
    localLoading: false,
    handleChangeUserMfaSelection: vi.fn(),
    handleSetUserOtpValue: vi.fn(),
    requestOtpCode: vi
      .fn()
      .mockResolvedValue({ success: true, trxnId: "mock-transaction-id" }),
    validateOtpCode: (otpValue, callback) => {
      if (callback) {
        callback({ success: true });
      }
    },
    setLocalLoading: vi.fn(),
  }),
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
      status: 200,
      data: { data: { redirect_url: "https://logout.example.com" } },
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
});
