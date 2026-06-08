import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import { BrowserRouter } from "react-router";
import ChangePasswordIndex from "../ChangePasswordIndex";
import { usePasswordValidation } from "../../../../hooks/usePasswordValidation";
import { passwordUpdate } from "../../api/passwordUpdate";
import { authService } from "../../../../services/authService";

// ─── Captured spy ─────────────────────────────────────────────────────────────

const { mockTrackEvent } = vi.hoisted(() => ({
  mockTrackEvent: vi.fn(),
}));

// ─── Module mocks ─────────────────────────────────────────────────────────────

vi.mock("../../../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({ trackEvent: mockTrackEvent }),
}));

vi.mock("../../../../hooks/useWizardPageTracking", () => ({
  useWizardPageTracking: vi.fn(),
}));

vi.mock("../../../../hooks/usePasswordValidation");

vi.mock("../../../../hooks/useOtpOperations", () => ({
  useOtpOperations: () => ({
    userPhoneFactors: [{ id: "f1", type: "sms", destination: "+15551234567" }],
    userSelectedMfaFactor: { id: "f1", type: "sms" },
    userSelectedMfaFactorRef: { current: { id: "f1", type: "sms" } },
    userOtpValue: "123456",
    otpSentResponse: null,
    otpLoading: false,
    handleChangeUserMfaSelection: vi.fn(),
    handleSetUserOtpValue: vi.fn(),
    setOtpLoading: vi.fn(),
    setUserSelectedMfaFactor: vi.fn(),
  }),
}));

vi.mock("../../../../hooks/useOtpAttemptTracking", () => ({
  useOtpAttemptTracking: () => ({
    getDisplayError: (msg) => `tracked:${msg}`,
    resetAttempts: vi.fn(),
    isMaxAttemptsReached: false,
  }),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => vi.fn(),
  };
});

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: { id: "test-id", userName: "test@example.com" },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({ setLoading: vi.fn() }),
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/en/security-settings",
}));

vi.mock("../../../../utils/errorUtils", () => ({
  getErrorMessage: (_lang, code) => {
    if (code === "CSIAM0010E" || code === "CSIAM0023E") {
      return "otp_max_attempts";
    }
    return code || "";
  },
}));

vi.mock("../../../../services/authService", () => ({
  authService: {
    verifyPassword: vi.fn(),
    logout: vi.fn(),
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
  },
}));

vi.mock("../../api/passwordUpdate", () => ({
  passwordUpdate: {
    firstStep: vi.fn(),
    secondStep: vi.fn(),
  },
}));

vi.mock("../../../../components/Layout/Loading", () => ({
  default: () => <div data-testid="loader" />,
}));

vi.mock("../../../../components/Wizard/StepContent", () => ({
  default: ({ StepComponent }) => (
    <div data-testid="step-content">{StepComponent}</div>
  ),
}));

vi.mock("../../../TransientOtp/components/PasswordVerification", () => ({
  default: ({ validatePassword }) => (
    <button
      data-testid="validate-password-btn"
      onClick={() => validatePassword("test-pw")}
    >
      Validate
    </button>
  ),
}));

vi.mock("../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext }) => (
    <button data-testid="otp-selection-next-btn" onClick={onNext}>
      OTP Selection Next
    </button>
  ),
}));

vi.mock("../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ validateOtpCode, userOtpValue, otpExpiry, errorMessage }) => (
    <div>
      <button
        data-testid="verify-otp-btn"
        data-otp-expiry={otpExpiry ?? ""}
        onClick={() => validateOtpCode(userOtpValue ?? "123456")}
      >
        Verify OTP
      </button>
      <span data-testid="otp-error-message">{errorMessage}</span>
    </div>
  ),
}));

vi.mock("../Password", () => ({
  default: ({ onNext }) => (
    <div data-testid="password-change-form">
      <button data-testid="password-change-next-btn" onClick={onNext}>
        Done
      </button>
    </div>
  ),
}));

vi.mock("../PasswordChangedConfirmation", () => ({
  default: ({ onNext }) => (
    <button data-testid="confirmation-next-btn" onClick={onNext}>
      Confirm
    </button>
  ),
}));

// ─── Helper ───────────────────────────────────────────────────────────────────

const renderComponent = () =>
  render(
    <BrowserRouter>
      <ChangePasswordIndex />
    </BrowserRouter>,
  );

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("ChangePasswordIndex – GA Error Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    // Default: password validation passes (calls onSuccess)
    usePasswordValidation.mockImplementation(
      (_setErr, onSuccess, _useStepup, _onError) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }),
    );

    // Default: OTP send succeeds
    passwordUpdate.firstStep.mockResolvedValue({
      success: true,
      data: { trxId: "trx-123" },
    });

    // Default: OTP validate succeeds
    passwordUpdate.secondStep.mockResolvedValue({ success: true });

    // Default: logout succeeds
    authService.logout.mockResolvedValue({
      data: { redirect_url: "https://logout.example.com" },
    });
  });

  it("emits form_step_end with error when password verify API fails", async () => {
    let capturedOnError;
    usePasswordValidation.mockImplementationOnce(
      (_setErr, _onSuccess, _useStepup, onError) => {
        capturedOnError = onError;
        return { validatePassword: vi.fn(), validatePasswordLoading: false };
      },
    );

    renderComponent();

    await act(async () => {
      capturedOnError?.("CSIAM0011E");
    });

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: "form_step_end",
      step: "verify_password",
      error: "CSIAM0011E",
    });
  });

  it("emits form_step_end with error when OTP send (requestOtpCode) API fails", async () => {
    // With phone factors, password validation goes to OTP selection,
    // then clicking next triggers requestOtpCode
    passwordUpdate.firstStep.mockRejectedValueOnce({
      data: { message: "OTP_SEND_FAILED" },
    });

    renderComponent();

    // Clicking validate goes to OTP selection (phone factors exist)
    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // Wait for OTP selection step
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    // Click next → calls requestOtpCode → fails → GA event
    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "otp_validation",
        error: "OTP_SEND_FAILED",
      });
    });
  });

  it("emits form_step_end with error when OTP validate (secondStep) API fails", async () => {
    passwordUpdate.secondStep.mockRejectedValueOnce({
      data: { message: "INVALID_OTP" },
    });

    // Provide a trxId in the firstStep response so validateOtpCode proceeds
    passwordUpdate.firstStep.mockResolvedValueOnce({
      success: true,
      data: { trxId: "trx-abc" },
    });

    renderComponent();

    // Password verification → OTP selection (phone factors exist)
    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // OTP selection → click next to go to OTP validation
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    // Trigger validateOtpCode
    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "otp_validation",
        error: "INVALID_OTP",
      });
    });
  });

  it("shows backend CSIAM0011E message directly on OTP validation", async () => {
    passwordUpdate.secondStep.mockRejectedValueOnce({
      data: { message: "CSIAM0011E" },
    });

    passwordUpdate.firstStep.mockResolvedValueOnce({
      success: true,
      data: { trxId: "trx-001" },
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-error-message")).toHaveTextContent(
        "CSIAM0011E",
      );
    });
  });

  it("maps CSIAM0023E to otp_max_attempts on OTP validation", async () => {
    passwordUpdate.secondStep.mockRejectedValueOnce({
      data: { messageId: "CSIAM0023E" },
    });

    passwordUpdate.firstStep.mockResolvedValueOnce({
      success: true,
      data: { trxId: "trx-002" },
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-error-message")).toHaveTextContent(
        "otp_max_attempts",
      );
    });
  });

  it("emits form_step_end with error when logout API fails", async () => {
    authService.logout.mockRejectedValueOnce(new Error("Network Error"));

    renderComponent();

    // Step 1: password verification → OTP selection (phone factors exist)
    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // Step 1b: OTP selection → click next → OTP validation
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    // Step 2: OTP validation
    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    // Step 3: password change form
    await waitFor(() =>
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("password-change-next-btn"));
    });

    // Step 4: confirmation step
    await waitFor(() =>
      expect(screen.getByTestId("confirmation-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("confirmation-next-btn"));
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_end",
        step: "logout",
        error: "Network Error",
      });
    });
  });
});

describe("ChangePasswordIndex – GA Success Path Tracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();

    usePasswordValidation.mockImplementation(
      (_setErr, onSuccess, _useStepup, _onError) => ({
        validatePassword: vi.fn(async () => {
          onSuccess?.();
        }),
        validatePasswordLoading: false,
      }),
    );

    passwordUpdate.firstStep.mockResolvedValue({
      success: true,
      data: { trxId: "trx-123" },
    });

    passwordUpdate.secondStep.mockResolvedValue({ success: true });

    authService.logout.mockResolvedValue({
      data: { redirect_url: "https://logout.example.com" },
    });
  });

  it("fires GA events after password validates and OTP is sent (verify_password → otp_selection → otp_validation)", async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // With phone factors, password validation goes to otp_selection first
    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_start",
        step: "verify_password",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_change",
        step: "otp_selection",
      });
    });

    // Click next on OTP selection to trigger requestOtpCode
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_change",
        step: "otp_validation",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_submit_complete",
        step: "otp_validation",
      });
    });
  });

  it("passes the password update expiryTime to the OTP verification screen", async () => {
    const expiryTime = "2026-05-29T12:34:56Z";
    passwordUpdate.firstStep.mockResolvedValueOnce({
      success: true,
      data: { trxId: "trx-123", expiryTime },
    });

    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    expect(screen.getByTestId("verify-otp-btn")).toHaveAttribute(
      "data-otp-expiry",
      expiryTime,
    );
  });

  it("fires GA events when OTP is validated (otp_validation → change_password)", async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // Go through OTP selection step
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    await waitFor(() => {
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_submit",
        step: "otp_validation",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_start",
        step: "otp_validation",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_submit_complete",
        step: "otp_validation",
      });
      expect(mockTrackEvent).toHaveBeenCalledWith({
        event: "form_step_change",
        step: "change_password",
      });
    });
  });

  it("fires GA events through password change to logout success (change_password → logout)", async () => {
    renderComponent();

    await act(async () => {
      fireEvent.click(screen.getByTestId("validate-password-btn"));
    });

    // Go through OTP selection step
    await waitFor(() =>
      expect(screen.getByTestId("otp-selection-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("otp-selection-next-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("verify-otp-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("verify-otp-btn"));
    });

    await waitFor(() =>
      expect(screen.getByTestId("password-change-form")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("password-change-next-btn"));
    });

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: "form_step_change",
      step: "password_changed_success",
    });

    await waitFor(() =>
      expect(screen.getByTestId("confirmation-next-btn")).toBeInTheDocument(),
    );

    await act(async () => {
      fireEvent.click(screen.getByTestId("confirmation-next-btn"));
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
