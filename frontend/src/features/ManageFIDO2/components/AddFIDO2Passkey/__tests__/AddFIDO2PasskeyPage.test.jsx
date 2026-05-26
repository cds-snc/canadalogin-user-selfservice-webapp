/**
 * Unit tests for AddFIDO2PasskeyPage component
 *
 * Tests verify component orchestration:
 * - Default wizard step is passwordVerification
 * - Initial step can be overridden via the `step` prop
 * - Loader is displayed when any loading state is true
 * - Password validation success navigates to otpValidation (single factor)
 *   or otpSelection (multiple factors / FIDO2 keys present)
 * - OTP selection moves to otpValidation or verifyFIDO2Passkey
 * - OTP validation back-navigation respects factor count
 * - handleGetAttestationOptions: WebAuthn unsupported, API failure, popup errors,
 *   and success advancing to addFIDO2PasskeyNickname
 * - handleSubmitAttestation: success navigates with noticeType, failure sets error
 * - Cancel calls navigate
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import AddFIDO2PasskeyPage from "../AddFIDO2PasskeyPage";

// ─── Router ────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
}));

// ─── Utilities ─────────────────────────────────────────────────────────────

vi.mock("../../../../../utils/routeHelpers", () => ({
  path: (_page, { language } = {}) => `/${language}/mock-path`,
}));

vi.mock("../../../../../utils/constants", () => ({
  PAGES: {
    otpSelection: "OtpSelection",
    addFIDO2Passkey: "AddFIDO2Passkey",
    addFIDO2PasskeyNickname: "AddFIDO2PasskeyNickname",
    addFIDO2PasskeyPage: "AddFIDO2PasskeyPage",
    securitySettings: "SecuritySettings",
    manage2FAVerifications: "Manage2FAVerifications",
    error: "Error",
  },
  serverMapping: {
    sms: "sms",
    voice: "voice",
  },
  NOTICE_TYPES: {
    passkeyAdded: "passkeyAdded",
  },
  INVALID_OTP_ERROR_CODES: ["INVALID_OTP", "EXPIRED_OTP"],
  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("../../../../../utils/functions", () => ({
  getPageContent: (_lang, page) => {
    if (page === "OtpSelection") {
      return { 11: "Loading..." };
    }
    return { 11: "Loading..." };
  },
}));

vi.mock("../../../../../utils/errorUtils", () => ({
  getErrorMessage: () => "",
}));

// ─── Layout primitives ─────────────────────────────────────────────────────

vi.mock("../../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

vi.mock("../../../../../components/Wizard/StepContent", () => ({
  default: ({ StepComponent }) => (
    <div data-testid="step-content">{StepComponent}</div>
  ),
}));

// ─── Providers / Hooks ─────────────────────────────────────────────────────

vi.mock("../../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: { id: "user-1", userName: "test@example.com" },
    },
  }),
}));

// useOtpOperations – configurable per test
const mockOtpOpsDefaults = {
  userPhoneFactors: [{ id: "factor-1", type: "sms" }],
  userSelectedMfaFactor: { id: "factor-1", type: "sms" },
  userOtpValue: "",
  otpSentResponse: { trxnId: "txn-123" },
  otpLoading: false,
  handleChangeUserMfaSelection: vi.fn(),
  handleSetUserOtpValue: vi.fn(),
  setOtpSentResponse: vi.fn(),
  requestOtpCode: vi.fn().mockResolvedValue(true),
};
const mockUseOtpOperations = vi.fn(() => mockOtpOpsDefaults);
vi.mock("../../../../../hooks/useOtpOperations", () => ({
  useOtpOperations: (...args) => mockUseOtpOperations(...args),
}));

// usePasskeyOperations – configurable per test
const mockPasskeyOpsDefaults = {
  fido2Data: [],
  loading: false,
  refetch: vi.fn(),
};
const mockUsePasskeyOperations = vi.fn(() => mockPasskeyOpsDefaults);
vi.mock("../../../../../hooks/usePasskeyOperations", () => ({
  usePasskeyOperations: (...args) => mockUsePasskeyOperations(...args),
}));

// usePasswordValidation – capture the onSuccess callback
let capturedPasswordSuccessCallback = null;
const mockValidatePassword = vi.fn();
const mockValidatePasswordLoading = { value: false };
vi.mock("../../../../../hooks/usePasswordValidation", () => ({
  usePasswordValidation: (_setErrorCode, onSuccess) => {
    capturedPasswordSuccessCallback = onSuccess;
    return {
      validatePassword: mockValidatePassword,
      validatePasswordLoading: mockValidatePasswordLoading.value,
    };
  },
}));

// ─── Services ──────────────────────────────────────────────────────────────

const mockTransientOtpSend = vi.fn();
const mockTransientOtpVerify = vi.fn();
vi.mock("../../../../../services/authService", () => ({
  authService: {
    transientOtpSend: (...args) => mockTransientOtpSend(...args),
    transientOtpVerify: (...args) => mockTransientOtpVerify(...args),
  },
}));

const mockGetAttestationOptions = vi.fn();
const mockSubmitAttestationResult = vi.fn();
vi.mock("../../../api/fido2Api", () => ({
  fido2Api: {
    getAttestationOptions: (...args) => mockGetAttestationOptions(...args),
    submitAttestationResult: (...args) => mockSubmitAttestationResult(...args),
  },
}));

// ─── WebAuthn utils ────────────────────────────────────────────────────────

const mockIsWebAuthnSupported = vi.fn(() => true);
const mockRegisterFIDO2Credential = vi.fn();
vi.mock("../../../utils/webAuthnUtils", () => ({
  isWebAuthnSupported: (...args) => mockIsWebAuthnSupported(...args),
  registerFIDO2Credential: (...args) => mockRegisterFIDO2Credential(...args),
}));

// ─── Child step components (stub versions) ─────────────────────────────────

vi.mock("../../../../TransientOtp/components/PasswordVerification", () => ({
  default: ({ validatePassword, onCancel }) => (
    <div data-testid="step-passwordVerification">
      <button
        data-testid="password-submit"
        onClick={() => validatePassword("pass")}
      >
        Submit Password
      </button>
      <button data-testid="password-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext, onSelectFIDO2, onCancel }) => (
    <div data-testid="step-otpSelection">
      <button data-testid="otp-selection-next" onClick={onNext}>
        Next
      </button>
      <button
        data-testid="otp-selection-fido2"
        onClick={() =>
          onSelectFIDO2({
            id: "passkey-42",
            attributes: { nickname: "Work Laptop" },
          })
        }
      >
        Use FIDO2
      </button>
      <button data-testid="otp-selection-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ validateOtpCode, onBack, onCancel }) => (
    <div data-testid="step-otpValidation">
      <button
        data-testid="otp-validate"
        onClick={() => validateOtpCode("123456")}
      >
        Validate OTP
      </button>
      <button data-testid="otp-back" onClick={onBack}>
        Back
      </button>
      <button data-testid="otp-cancel" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../../VerifyFIDO2Passkey/VerifyFIDO2Passkey", () => ({
  default: ({ onCallback, onTryAnotherWayHandler }) => (
    <div data-testid="step-verifyFIDO2Passkey">
      <button data-testid="fido2-verify-callback" onClick={() => onCallback()}>
        Verify
      </button>
      <button
        data-testid="fido2-try-another"
        onClick={() => onTryAnotherWayHandler()}
      >
        Try Another Way
      </button>
    </div>
  ),
}));

vi.mock("../AddFIDO2Passkey", () => ({
  default: ({ onRegister, onCancel, registrationLoading }) => (
    <div data-testid="step-addFIDO2Passkey">
      <button data-testid="add-register" onClick={onRegister}>
        Create Passkey
      </button>
      <button data-testid="add-cancel" onClick={onCancel}>
        Cancel
      </button>
      {registrationLoading && <span data-testid="add-loading">Loading...</span>}
    </div>
  ),
}));

vi.mock("../AddFIDO2PasskeyNickname", () => ({
  default: ({ onSubmit, registrationLoading }) => (
    <div data-testid="step-addFIDO2PasskeyNickname">
      <button
        data-testid="nickname-submit"
        onClick={() => onSubmit("My Device")}
      >
        Save
      </button>
      {registrationLoading && (
        <span data-testid="nickname-loading">Loading...</span>
      )}
    </div>
  ),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

const renderPage = (props = {}) => render(<AddFIDO2PasskeyPage {...props} />);
const getStep = (testId) => screen.queryByTestId(testId);

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("AddFIDO2PasskeyPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseOtpOperations.mockReturnValue({ ...mockOtpOpsDefaults });
    mockUsePasskeyOperations.mockReturnValue({ ...mockPasskeyOpsDefaults });
    mockValidatePasswordLoading.value = false;
    capturedPasswordSuccessCallback = null;
    mockIsWebAuthnSupported.mockReturnValue(true);
    mockRegisterFIDO2Credential.mockResolvedValue({ credentialId: "cred-1" });
    mockGetAttestationOptions.mockResolvedValue({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockSubmitAttestationResult.mockResolvedValue({ success: true });
    mockTransientOtpSend.mockResolvedValue({
      success: true,
      data: { trxnId: "txn-123" },
    });
    mockTransientOtpVerify.mockResolvedValue({ success: true });
  });

  // ── Initial render ────────────────────────────────────────────────────

  it("renders the passwordVerification step by default", () => {
    renderPage();
    expect(getStep("step-passwordVerification")).toBeInTheDocument();
  });

  it("allows passkey-only users to stay on add passkey page", () => {
    renderPage();

    expect(mockUseOtpOperations).toHaveBeenCalledWith(
      expect.objectContaining({
        allowEmptyFactors: true,
      }),
    );
  });

  it("renders the step provided via the step prop", () => {
    renderPage({ step: "otpSelection" });
    expect(getStep("step-otpSelection")).toBeInTheDocument();
    expect(getStep("step-passwordVerification")).not.toBeInTheDocument();
  });

  it("renders the addFIDO2Passkey step when step prop is set", () => {
    renderPage({ step: "addFIDO2Passkey" });
    expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
  });

  it("renders the addFIDO2PasskeyNickname step when step prop is set", () => {
    renderPage({ step: "addFIDO2PasskeyNickname" });
    expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument();
  });

  it("renders the verifyFIDO2Passkey step when step prop is set", () => {
    renderPage({ step: "verifyFIDO2Passkey" });
    expect(getStep("step-verifyFIDO2Passkey")).toBeInTheDocument();
  });

  // ── Loader ────────────────────────────────────────────────────────────

  it("shows Loader when otpLoading is true", () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      otpLoading: true,
    });
    renderPage();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(getStep("step-passwordVerification")).not.toBeInTheDocument();
  });

  it("shows Loader when validatePasswordLoading is true", () => {
    mockValidatePasswordLoading.value = true;
    renderPage();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("shows Loader when passkeyLoading is true", () => {
    mockUsePasskeyOperations.mockReturnValue({
      ...mockPasskeyOpsDefaults,
      loading: true,
    });
    renderPage();
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  // ── Password step → OTP step ──────────────────────────────────────────

  it("navigates to otpValidation after password when single factor and no FIDO2", async () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      userPhoneFactors: [{ id: "factor-1", type: "sms" }],
    });
    mockUsePasskeyOperations.mockReturnValue({
      ...mockPasskeyOpsDefaults,
      fido2Data: [],
    });
    renderPage();

    await waitFor(() => expect(capturedPasswordSuccessCallback).not.toBeNull());
    await act(async () => {
      capturedPasswordSuccessCallback();
    });

    await waitFor(() =>
      expect(getStep("step-otpValidation")).toBeInTheDocument(),
    );
    expect(getStep("step-passwordVerification")).not.toBeInTheDocument();
  });

  it("navigates to otpSelection after password when multiple MFA factors", async () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      userPhoneFactors: [
        { id: "factor-1", type: "sms" },
        { id: "factor-2", type: "voice" },
      ],
    });
    renderPage();

    await waitFor(() => expect(capturedPasswordSuccessCallback).not.toBeNull());
    await act(async () => {
      capturedPasswordSuccessCallback();
    });

    await waitFor(() =>
      expect(getStep("step-otpSelection")).toBeInTheDocument(),
    );
  });

  it("navigates to otpSelection after password when FIDO2 data is present", async () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      userPhoneFactors: [{ id: "factor-1", type: "sms" }],
    });
    mockUsePasskeyOperations.mockReturnValue({
      ...mockPasskeyOpsDefaults,
      fido2Data: [{ id: "passkey-1" }],
    });
    renderPage();

    await waitFor(() => expect(capturedPasswordSuccessCallback).not.toBeNull());
    await act(async () => {
      capturedPasswordSuccessCallback();
    });

    await waitFor(() =>
      expect(getStep("step-otpSelection")).toBeInTheDocument(),
    );
  });

  it("calls validatePassword when the submit button is clicked", async () => {
    renderPage();
    await userEvent.click(screen.getByTestId("password-submit"));
    expect(mockValidatePassword).toHaveBeenCalledWith("pass");
  });

  it("calls navigate on cancel from passwordVerification", async () => {
    renderPage();
    await userEvent.click(screen.getByTestId("password-cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path");
  });

  // ── OTP Selection step ────────────────────────────────────────────────

  it("navigates to otpValidation when Next is clicked in otpSelection", async () => {
    renderPage({ step: "otpSelection" });
    await userEvent.click(screen.getByTestId("otp-selection-next"));
    expect(getStep("step-otpValidation")).toBeInTheDocument();
  });

  it("navigates to verifyFIDO2Passkey when a FIDO2 key is selected in otpSelection", async () => {
    renderPage({ step: "otpSelection" });
    await userEvent.click(screen.getByTestId("otp-selection-fido2"));
    expect(getStep("step-verifyFIDO2Passkey")).toBeInTheDocument();
  });

  it("calls navigate on cancel from otpSelection", async () => {
    renderPage({ step: "otpSelection" });
    await userEvent.click(screen.getByTestId("otp-selection-cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path");
  });

  // ── OTP Validation step ───────────────────────────────────────────────

  it("navigates back to otpSelection from otpValidation when multiple factors", async () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      userPhoneFactors: [
        { id: "factor-1", type: "sms" },
        { id: "factor-2", type: "voice" },
      ],
    });
    renderPage({ step: "otpValidation" });
    await userEvent.click(screen.getByTestId("otp-back"));
    expect(getStep("step-otpSelection")).toBeInTheDocument();
  });

  it("navigates back to passwordVerification from otpValidation when single factor", async () => {
    mockUseOtpOperations.mockReturnValue({
      ...mockOtpOpsDefaults,
      userPhoneFactors: [{ id: "factor-1", type: "sms" }],
    });
    renderPage({ step: "otpValidation" });
    await userEvent.click(screen.getByTestId("otp-back"));
    expect(getStep("step-passwordVerification")).toBeInTheDocument();
  });

  it("navigates to addFIDO2Passkey after successful OTP verification", async () => {
    mockTransientOtpVerify.mockResolvedValueOnce({ success: true });
    renderPage({ step: "otpValidation" });
    await userEvent.click(screen.getByTestId("otp-validate"));
    await waitFor(() =>
      expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument(),
    );
  });

  it("does not advance when OTP verification fails", async () => {
    mockTransientOtpVerify.mockRejectedValueOnce({
      response: { data: { message: "INVALID_OTP" } },
    });
    renderPage({ step: "otpValidation" });
    await userEvent.click(screen.getByTestId("otp-validate"));
    await waitFor(() =>
      expect(getStep("step-otpValidation")).toBeInTheDocument(),
    );
  });

  it("calls navigate on cancel from otpValidation", async () => {
    renderPage({ step: "otpValidation" });
    await userEvent.click(screen.getByTestId("otp-cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path");
  });

  // ── VerifyFIDO2Passkey step ───────────────────────────────────────────

  it("navigates to addFIDO2Passkey after FIDO2 verification callback", async () => {
    renderPage({ step: "verifyFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("fido2-verify-callback"));
    expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
  });

  it("navigates back to otpSelection when Try Another Way is clicked in verifyFIDO2Passkey", async () => {
    renderPage({ step: "verifyFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("fido2-try-another"));
    expect(getStep("step-otpSelection")).toBeInTheDocument();
  });

  // ── handleGetAttestationOptions ───────────────────────────────────────

  it("sets error_webauthn_not_supported when WebAuthn is unavailable", async () => {
    mockIsWebAuthnSupported.mockReturnValue(false);
    // We can't easily read errorCode directly, but we expect onRegister to
    // short-circuit and NOT call getAttestationOptions
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      expect(mockGetAttestationOptions).not.toHaveBeenCalled();
    });
  });

  it("does not advance when getAttestationOptions returns unsuccessful response", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({ success: false });
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      // Should remain on addFIDO2Passkey step, not advance to nickname
      expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
      expect(getStep("step-addFIDO2PasskeyNickname")).not.toBeInTheDocument();
    });
  });

  it("does not advance when getAttestationOptions returns null data", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: null,
    });
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
    });
  });

  it("advances to addFIDO2PasskeyNickname after successful attestation options + WebAuthn popup", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockResolvedValueOnce({ credentialId: "abc" });
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument();
    });
    expect(mockRegisterFIDO2Credential).toHaveBeenCalledWith({
      challenge: "test-challenge",
    });
  });

  it("does not advance to nickname step when WebAuthn popup throws InvalidStateError (duplicate passkey)", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    const domErr = new DOMException("Already registered", "InvalidStateError");
    mockRegisterFIDO2Credential.mockRejectedValueOnce(domErr);
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
      expect(getStep("step-addFIDO2PasskeyNickname")).not.toBeInTheDocument();
    });
  });

  it("does not advance when WebAuthn popup throws a generic error", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockRejectedValueOnce(
      new Error("browser error"),
    );
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() => {
      expect(getStep("step-addFIDO2Passkey")).toBeInTheDocument();
    });
  });

  it("calls navigate on cancel from addFIDO2Passkey", async () => {
    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-cancel"));
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path");
  });

  // ── handleSubmitAttestation ───────────────────────────────────────────

  it("navigates with passkeyAdded noticeType after successful attestation submission", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockResolvedValueOnce({ credentialId: "abc" });
    mockSubmitAttestationResult.mockResolvedValueOnce({ success: true });

    renderPage({ step: "addFIDO2Passkey" });

    // Step 1: trigger WebAuthn popup
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() =>
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument(),
    );

    // Step 2: submit nickname
    await userEvent.click(screen.getByTestId("nickname-submit"));
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/mock-path",
        expect.objectContaining({
          state: expect.objectContaining({
            noticeType: "passkeyAdded",
            passkeyName: "My Device",
          }),
        }),
      ),
    );
  });

  it("merges attestation result with device name when calling submitAttestationResult", async () => {
    const registrationData = { credentialId: "abc", transports: ["usb"] };
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockResolvedValueOnce(registrationData);
    mockSubmitAttestationResult.mockResolvedValueOnce({ success: true });

    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() =>
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId("nickname-submit"));
    await waitFor(() =>
      expect(mockSubmitAttestationResult).toHaveBeenCalledWith({
        ...registrationData,
        nickname: "My Device",
      }),
    );
  });

  it("does not navigate when submitAttestationResult returns unsuccessful", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockResolvedValueOnce({ credentialId: "abc" });
    mockSubmitAttestationResult.mockResolvedValueOnce({ success: false });

    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() =>
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId("nickname-submit"));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument();
    });
  });

  it("stays on nickname step when submitAttestationResult throws", async () => {
    mockGetAttestationOptions.mockResolvedValueOnce({
      success: true,
      data: { challenge: "test-challenge" },
    });
    mockRegisterFIDO2Credential.mockResolvedValueOnce({ credentialId: "abc" });
    mockSubmitAttestationResult.mockRejectedValueOnce({
      data: { message: "server error" },
    });

    renderPage({ step: "addFIDO2Passkey" });
    await userEvent.click(screen.getByTestId("add-register"));
    await waitFor(() =>
      expect(getStep("step-addFIDO2PasskeyNickname")).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByTestId("nickname-submit"));
    await waitFor(() => {
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
