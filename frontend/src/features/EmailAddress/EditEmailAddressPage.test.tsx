import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import EditEmailAddressPage from "./EditEmailAddressPage";

const mocks = vi.hoisted(() => ({
  navigate: vi.fn(),
  trackEvent: vi.fn(),
  handleSetUserOtpValue: vi.fn(),
  requestOtpCode: vi.fn(async () => true),
  validateOtpCode: vi.fn(async (_otp: string, onSuccess?: () => void) => {
    onSuccess?.();
    return true;
  }),
  updateEmailWithOtp: vi.fn(async () => {
    throw { data: { message: "CSIAM0011E" } };
  }),
  resetAttempts: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => mocks.navigate,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        id: "user-id",
        userName: "test.user@example.com",
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: vi.fn(),
  }),
}));

vi.mock("../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({
    trackEvent: mocks.trackEvent,
  }),
}));

vi.mock("../../hooks/useWizardPageTracking", () => ({
  useWizardPageTracking: vi.fn(),
}));

vi.mock("../../hooks/usePasswordValidation", () => ({
  usePasswordValidation: (
    _setErrorCode: (code: string) => void,
    onSuccess: () => Promise<void>,
  ) => ({
    validatePassword: vi.fn(async () => {
      await onSuccess();
    }),
    validatePasswordLoading: false,
  }),
}));

vi.mock("../../hooks/useOtpOperations", () => ({
  useOtpOperations: () => ({
    userPhoneFactors: [{ id: "factor-1", type: "smsotp" }],
    userSelectedMfaFactor: { id: "factor-1", type: "smsotp" },
    userOtpValue: "123456",
    otpSentResponse: {
      trxnId: "transaction-1",
      expiry: null,
      created: null,
    },
    otpLoading: false,
    handleChangeUserMfaSelection: vi.fn(),
    handleSetUserOtpValue: mocks.handleSetUserOtpValue,
    requestOtpCode: mocks.requestOtpCode,
    validateOtpCode: mocks.validateOtpCode,
    setOtpLoading: vi.fn(),
  }),
}));

vi.mock("../../hooks/usePasskeyOperations", () => ({
  usePasskeyOperations: () => ({
    fido2Data: [],
    loading: false,
  }),
}));

vi.mock("../../hooks/useOtpAttemptTracking", () => ({
  useOtpAttemptTracking: (errorCode?: string | null) => ({
    getDisplayError: () => (errorCode ? `display:${errorCode}` : ""),
    resetAttempts: mocks.resetAttempts,
    isMaxAttemptsReached: false,
  }),
}));

vi.mock("../../services/authService", () => ({
  authService: {
    logout: vi.fn(),
    update_email_with_otp: mocks.updateEmailWithOtp,
  },
}));

vi.mock("../../components/Layout/Loading", () => ({
  default: ({ text }: { text: string }) => <div>{text}</div>,
}));

vi.mock("../../components/Wizard/StepContent", () => ({
  default: ({
    StepComponent,
    errorCode,
    errorMessage,
  }: {
    StepComponent: ReactNode;
    errorCode?: string;
    errorMessage?: string;
  }) => (
    <div>
      {errorCode || errorMessage ? (
        <div data-testid="error-summary">{errorMessage || errorCode}</div>
      ) : null}
      <div>{StepComponent}</div>
    </div>
  ),
}));

vi.mock("../TransientOtp/components/PasswordVerification", () => ({
  default: ({
    validatePassword,
  }: {
    validatePassword: (password: string) => Promise<void>;
  }) => (
    <button type="button" onClick={() => void validatePassword("Password1!")}>
      verify password
    </button>
  ),
}));

vi.mock("../TransientOtp/components/OtpSelection", () => ({
  default: () => <div>otp selection</div>,
}));

vi.mock("../TransientOtp/components/OtpVerification", () => ({
  default: ({
    validateOtpCode,
    onBack,
  }: {
    validateOtpCode: () => Promise<void | boolean>;
    onBack: () => void;
  }) => (
    <>
      <button type="button" onClick={() => void validateOtpCode()}>
        verify account otp
      </button>
      <button type="button" onClick={() => onBack()}>
        choose different method
      </button>
    </>
  ),
}));

vi.mock(
  "../ManageFIDO2/components/VerifyFIDO2Passkey/VerifyFIDO2Passkey",
  () => ({
    default: () => <div>verify passkey</div>,
  }),
);

vi.mock("./EditEmailEnterEmail", () => ({
  default: ({
    handleFormChange,
    onSubmit,
  }: {
    handleFormChange: (ev: CustomEvent<string>) => void;
    onSubmit: () => Promise<void>;
  }) => (
    <div>
      <button
        type="button"
        onClick={() => {
          handleFormChange({
            target: { name: "emailAddress", value: "new@example.com" },
          } as unknown as CustomEvent<string>);
        }}
      >
        fill new email
      </button>
      <button type="button" onClick={() => void onSubmit()}>
        submit new email
      </button>
    </div>
  ),
}));

vi.mock("./EmailOtpValidation", () => ({
  default: ({
    onSubmit,
    onBack,
  }: {
    onSubmit: () => Promise<void> | void;
    onBack: () => Promise<void> | void;
  }) => (
    <div>
      <button type="button" onClick={() => void onSubmit()}>
        continue with email otp
      </button>
      <button type="button" onClick={() => void onBack()}>
        use a different email
      </button>
    </div>
  ),
}));

vi.mock("./EmailConfirmUpdate", () => ({
  default: ({ onSubmit }: { onSubmit: () => Promise<void> }) => (
    <button type="button" onClick={() => void onSubmit()}>
      confirm email update
    </button>
  ),
}));

vi.mock("./EmailUpdateSuccess", () => ({
  default: () => <div>email update success</div>,
}));

describe("EditEmailAddressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("resets OTP attempts after account OTP verification succeeds", async () => {
    render(<EditEmailAddressPage />);

    fireEvent.click(screen.getByRole("button", { name: "verify password" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "verify account otp" }),
    );

    expect(mocks.resetAttempts).toHaveBeenCalledTimes(1);
    expect(
      await screen.findByRole("button", { name: "submit new email" }),
    ).toBeInTheDocument();
  });

  it("clears OTP input when backing out of otp verification", async () => {
    render(<EditEmailAddressPage />);

    fireEvent.click(screen.getByRole("button", { name: "verify password" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "choose different method" }),
    );

    expect(mocks.handleSetUserOtpValue).toHaveBeenCalledWith("");
    expect(
      await screen.findByRole("button", { name: "verify password" }),
    ).toBeInTheDocument();
  });

  it("clears OTP input when choosing a different email", async () => {
    render(<EditEmailAddressPage />);

    fireEvent.click(screen.getByRole("button", { name: "verify password" }));
    fireEvent.click(
      await screen.findByRole("button", { name: "verify account otp" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "fill new email" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "submit new email" }),
    );

    const callsBeforeBack = mocks.handleSetUserOtpValue.mock.calls.length;

    fireEvent.click(
      await screen.findByRole("button", { name: "use a different email" }),
    );

    expect(mocks.handleSetUserOtpValue.mock.calls.length).toBe(
      callsBeforeBack + 1,
    );
    expect(mocks.handleSetUserOtpValue).toHaveBeenLastCalledWith("");
    expect(
      await screen.findByRole("button", { name: "submit new email" }),
    ).toBeInTheDocument();
  });

  it("clears OTP error summary after choosing a different email", async () => {
    render(<EditEmailAddressPage />);

    fireEvent.click(screen.getByRole("button", { name: "verify password" }));

    fireEvent.click(
      await screen.findByRole("button", { name: "verify account otp" }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "fill new email" }),
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "submit new email" }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "continue with email otp" }),
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "confirm email update" }),
    );

    expect(await screen.findByTestId("error-summary")).toHaveTextContent(
      "display:CSIAM0011E",
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "use a different email" }),
    );

    await waitFor(() => {
      expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
    });

    expect(
      await screen.findByRole("button", { name: "submit new email" }),
    ).toBeInTheDocument();
  });
});
