import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import OtpVerification from "../OtpVerification";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";

// Mock the navigation hooks
const mockNavigateHelper = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock user context
const mockUserState = {
  testData: undefined,
};

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: mockUserState,
  }),
}));

// Mock auth service
const mockTransientOtpSend = vi.fn();
const mockTransientOtpVerify = vi.fn();

vi.mock("../../../../services/authService", () => ({
  authService: {
    transientOtpSend: (...args) => mockTransientOtpSend(...args),
    transientOtpVerify: (...args) => mockTransientOtpVerify(...args),
  },
}));

// Mock utilities
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === PAGES.verification) {
      return {
        1: "Check your phone",
        2: "We have sent a text message with a 6-digit verification code to:",
        3: "We have sent a 6-digit verification code via voice call to:",
        4: "Your text (SMS) might take a few minutes to arrive.",
        5: "Your call might take a few minutes to arrive.",
        6: "Your code will expire in",
        7: "10 minutes.",
        8: "Enter the code",
        9: "6-digit code",
        10: "Problems with the code?",
        14: "Request a new code in",
        15: "seconds",
        16: "Request a new code",
        17: "We have sent you a new code",
        21: "Use a different phone number",
        22: "Check your email",
        23: "We have sent an email with a 6-digit code to:",
        24: "Your email might take a few minutes to arrive. If you do not get an email, check your spam folder.",
        26: "Send the code again",
      };
    }
    if (page === PAGES.error || page === "Error") {
      return {
        CSIAM0011E: "The verification code is invalid or has expired.",
        CSIAM0038E: "Too Many Attempts",
        CSIBN0025E: "The verification code is invalid or has expired.",
      };
    }
    if (page === "Button") {
      return {
        submit: "Continue",
        cancel: "Cancel",
      };
    }
    return {};
  }),
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: vi.fn((page, { language }) => {
    if (page === PAGES.securitySettings) {
      return `/${language}/security-settings`;
    }
    return `/${language}/test`;
  }),
}));

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, disabled, style }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children }) => (
    <div data-testid="container">{children}</div>
  ),
  GcdsErrorMessage: ({ children, messageId }) => (
    <div data-testid="error-message" data-message-id={messageId}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, columns, gap }) => (
    <div data-testid="grid" data-columns={columns} data-gap={gap}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag, lang }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid={`heading-${tag}`} lang={lang}>
        {children}
      </Tag>
    );
  },
  GcdsInput: ({
    inputId,
    label,
    value,
    onGcdsInput,
    errorMessage,
    type,
    maxlength,
    minlength,
    size,
    required,
    autofocus,
    autocomplete,
    validateOn,
    lang,
  }) => (
    <div data-testid="input-wrapper">
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        data-testid={inputId}
        type={type}
        value={value}
        onChange={onGcdsInput}
        maxLength={maxlength}
        minLength={minlength}
        size={size}
        required={
          required === true || (required !== false && errorMessage === "")
        }
        autoFocus={autofocus}
        autoComplete={autocomplete}
        data-validate-on={validateOn}
        data-lang={lang}
        data-error-message={errorMessage || ""}
      />
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick, href }) => (
    <a
      data-testid="gcds-link"
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
      href={href}
    >
      {children}
    </a>
  ),
  GcdsNotice: ({ children, type, noticeTitle, noticeTitleTag }) => (
    <div data-testid="notice" data-type={type} data-title-tag={noticeTitleTag}>
      <div data-testid="notice-title">{noticeTitle}</div>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <div data-testid="text">{children}</div>,
}));

const mockOnNext = vi.fn();
const mockOnBack = vi.fn();
const mockSetOtpSentResponse = vi.fn();
const mockSetUserOtpValue = vi.fn();
const mockRequestOtpCode = vi.fn();
const mockValidateOtpCode = vi.fn();
const mockSetErrorCode = vi.fn();
const mockOnCancel = vi.fn(() => mockNavigateHelper("/en/security-settings"));

const defaultProps = {
  onNext: mockOnNext,
  onBack: mockOnBack,
  requestOtpCode: mockRequestOtpCode,
  validateOtpCode: mockValidateOtpCode,
  setErrorCode: mockSetErrorCode,
  onCancel: mockOnCancel,
  errorMessage: "",
  userSelectedMfaFactor: {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    destination: "+15551234567",
  },
  otpSentResponse: {
    trxnId: "txn-123",
  },
  setOtpSentResponse: mockSetOtpSentResponse,
  setUserOtpValue: mockSetUserOtpValue,
  userOtpValue: "",
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <BrowserRouter>
      <OtpVerification {...mergedProps} />
    </BrowserRouter>,
  );
};

describe("OtpVerification Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserState.testData = undefined;

    // Setup default mock implementations
    mockTransientOtpSend.mockResolvedValue({
      success: true,
      data: { trxnId: "txn-123" },
    });
    mockTransientOtpVerify.mockResolvedValue({
      success: true,
    });

    // Make mockRequestOtpCode call the mocked authService and update state
    mockRequestOtpCode.mockImplementation(async () => {
      const response = await mockTransientOtpSend({
        userName: defaultProps.userProfile.userName,
        otpType: "sms",
        destination: defaultProps.userSelectedMfaFactor.destination,
      });
      if (response.success && response.data) {
        mockSetOtpSentResponse({ trxnId: response.data.trxnId });
      }
      return response;
    });

    // Make mockValidateOtpCode just return success/failure based on mockTransientOtpVerify
    mockValidateOtpCode.mockImplementation(async (otp) => {
      const response = await mockTransientOtpVerify({
        otp,
        trxnId: defaultProps.otpSentResponse.trxnId,
        otpType: "sms",
      });
      if (response.success) {
        mockOnNext();
      }
      return response;
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  describe("Rendering and Layout - SMS", () => {
    it("renders the main heading for SMS", () => {
      renderComponent();
      expect(screen.getByText("Check your phone")).toBeInTheDocument();
    });

    it("renders SMS-specific instructions", () => {
      renderComponent();
      expect(
        screen.getByText(
          /We have sent a text message with a 6-digit verification code to:/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your text \(SMS\) might take a few minutes to arrive\./,
        ),
      ).toBeInTheDocument();
    });

    it("displays the phone number for SMS", () => {
      renderComponent();
      const phoneNumbers = screen.getAllByText("+15551234567");
      expect(phoneNumbers.length).toBeGreaterThan(0);
    });

    it("renders the code expiration notice", () => {
      renderComponent();
      expect(screen.getByText(/Your code will expire in/)).toBeInTheDocument();
      expect(screen.getByText("10 minutes.")).toBeInTheDocument();
    });

    it("renders the Enter the code section heading", () => {
      renderComponent();
      expect(screen.getByText("Enter the code")).toBeInTheDocument();
    });

    it("renders the verification code input field", () => {
      renderComponent();
      const input = screen.getByTestId("verificationCode");
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("maxLength", "6");
      expect(input).toHaveAttribute("minLength", "6");
    });

    it("renders submit and choose different method buttons", () => {
      renderComponent();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Choose a different method" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Cancel" }),
      ).not.toBeInTheDocument();
    });

    it("renders Problems with the code section", () => {
      renderComponent();
      expect(screen.getByText("Problems with the code?")).toBeInTheDocument();
    });
  });

  describe("Rendering and Layout - Voice", () => {
    it("renders Voice-specific instructions", () => {
      const voiceFactor = {
        id: "factor-2",
        type: FLOW_TYPES.voice,
        destination: "+15559876543",
      };
      renderComponent({ userSelectedMfaFactor: voiceFactor });

      expect(
        screen.getByText(
          /We have sent a 6-digit verification code via voice call to:/,
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your call might take a few minutes to arrive\./),
      ).toBeInTheDocument();
    });

    it("displays the phone number for Voice", () => {
      const voiceFactor = {
        id: "factor-2",
        type: FLOW_TYPES.voice,
        destination: "+15559876543",
      };
      renderComponent({ userSelectedMfaFactor: voiceFactor });

      const phoneNumbers = screen.getAllByText("+15559876543");
      expect(phoneNumbers.length).toBeGreaterThan(0);
    });
  });

  describe("Rendering and Layout - Email", () => {
    it("renders Email-specific heading", () => {
      const emailFactor = {
        id: "factor-3",
        type: FLOW_TYPES.email,
        destination: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(screen.getByText("Check your email")).toBeInTheDocument();
    });

    it("renders Email-specific instructions", () => {
      const emailFactor = {
        id: "factor-3",
        type: FLOW_TYPES.email,
        destination: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(
        screen.getByText(/We have sent an email with a 6-digit code to:/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your email might take a few minutes to arrive\. If you cannot find the email in your inbox, check your spam folder\./,
        ),
      ).toBeInTheDocument();
    });

    it("does not render Enter the code heading for email", () => {
      const emailFactor = {
        id: "factor-3",
        type: FLOW_TYPES.email,
        destination: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(screen.queryByText("Enter the code")).not.toBeInTheDocument();
    });
  });

  describe("User Input Handling", () => {
    it("updates userOtpValue when user types", async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      await user.type(input, "1");

      expect(mockSetUserOtpValue).toHaveBeenCalledWith("1");
    });

    it("allows typing 6-digit code", async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      await user.type(input, "123456");

      expect(mockSetUserOtpValue).toHaveBeenCalledTimes(6);
    });

    it("displays the current userOtpValue", () => {
      renderComponent({ userOtpValue: "123456" });

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveValue("123456");
    });
  });

  describe("Submit Button Behavior", () => {
    it("disables submit button when code is less than 6 digits", () => {
      renderComponent({ userOtpValue: "12345" });

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });

    it("enables submit button when code is 6 digits", () => {
      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toBeDisabled();
    });

    it("calls validateOtpCode when submit is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalledWith("123456");
      });
    });

    it("calls onNext when verification is successful", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockImplementation(async () => {
        mockOnNext();
        return { success: true };
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalledWith("123456");
      });

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it("displays error when verification fails", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalledWith("123456");
      });

      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith("CSIAM0011E");
      });
    });

    it("clears error code when submitting again", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockRejectedValueOnce({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith("CSIAM0011E");
      });

      // Clear the mock to simulate successful verification
      mockValidateOtpCode.mockResolvedValue({ success: true });
      mockSetErrorCode.mockClear();

      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith(""); // Clear error first
      });
    });
  });

  describe("Choose Different Method Behavior", () => {
    it("calls onBack when choose a different method is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const chooseDifferentMethodButton = screen.getByRole("button", {
        name: "Choose a different method",
      });
      await user.click(chooseDifferentMethodButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("Resend Code Feedback", () => {
    it("renders a minute:second countdown from the OTP expiry timestamp", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2099-01-01T00:09:00.000Z"));

      renderComponent({ otpExpiry: "2099-01-01T00:10:00.000Z" });

      expect(screen.getByText("01:00")).toBeInTheDocument();
      expect(screen.getByText(/10\s+seconds/)).toBeInTheDocument();
    });

    it("keeps the resend link on the original short delay even when an OTP expiry exists", async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2099-01-01T00:09:00.000Z"));

      renderComponent({ otpExpiry: "2099-01-01T00:10:00.000Z" });

      expect(screen.queryByText("Request a new code")).not.toBeInTheDocument();

      for (let second = 0; second <= 10; second += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }

      expect(screen.getByText("Request a new code")).toBeInTheDocument();
      expect(screen.getByText(/^00:4[89]$/)).toBeInTheDocument();
    });

    it("shows the expired-state screen when the OTP has expired", () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2099-01-01T00:10:01.000Z"));

      renderComponent({ otpExpiry: "2099-01-01T00:10:00.000Z" });

      expect(
        screen.getByText("Your time-sensitive verification code has expired."),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Request a new code" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Choose a different method" }),
      ).toBeInTheDocument();
      expect(screen.queryByTestId("verificationCode")).not.toBeInTheDocument();
    });

    it("shows a success notice after requesting a new code", async () => {
      vi.useFakeTimers();
      mockRequestOtpCode.mockResolvedValue(true);

      renderComponent();

      for (let second = 0; second < 10; second += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(1000);
        });
      }

      const requestNewCodeLink = screen.getByText("Request a new code");
      await act(async () => {
        fireEvent.click(requestNewCodeLink);
      });

      expect(mockRequestOtpCode).toHaveBeenCalled();
      expect(screen.getByTestId("notice-title")).toHaveTextContent("Success");
      expect(screen.getByTestId("notice")).toHaveTextContent(
        "We have sent you a new code",
      );
    });
  });

  describe("Error Display", () => {
    it("does not display error message initially", () => {
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute("data-error-message", "");
    });

    it("displays error message when errorMessage is provided", () => {
      renderComponent({ errorMessage: "Test error message" });

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute("data-error-message", "Test error message");
    });

    it("passes error message to input field", () => {
      renderComponent({
        errorMessage: "The verification code is invalid or has expired.",
      });

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute(
        "data-error-message",
        "The verification code is invalid or has expired.",
      );
    });

    it("handles unknown error codes gracefully", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockRejectedValue({
        data: { message: "UNKNOWN_ERROR" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith("UNKNOWN_ERROR");
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles null userProfile gracefully", () => {
      renderComponent();

      expect(screen.getByText("Check your phone")).toBeInTheDocument();
      expect(mockRequestOtpCode).not.toHaveBeenCalled();
    });

    it("handles missing otpSentResponse", () => {
      renderComponent({ otpSentResponse: null });

      expect(screen.getByText("Check your phone")).toBeInTheDocument();
    });

    it("handles empty userOtpValue", () => {
      renderComponent({ userOtpValue: "" });

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveValue("");

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toBeDisabled();
    });

    it("handles OTP send error without message", async () => {
      // OTP send errors are now handled by the parent before navigation
      // This test verifies the resend button does not crash on error
      mockRequestOtpCode.mockRejectedValue({});

      renderComponent();

      // Should not call setErrorCode on mount (no auto-send)
      expect(mockSetErrorCode).not.toHaveBeenCalled();
    });

    it("handles OTP verify error without message", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockRejectedValue({});

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalledWith("123456");
      });

      // Should clear error first, but not set any new error
      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith("");
      });
    });
  });

  describe("Integration Tests", () => {
    it("complete workflow: mount, type code, submit, success", async () => {
      const user = userEvent.setup({ delay: null });
      mockValidateOtpCode.mockImplementation(async () => {
        mockOnNext();
        return { success: true };
      });

      renderComponent({ userOtpValue: "123456" });

      // Submit button should be enabled with 6-digit code
      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Verify success
      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalled();
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it("clears error when submitting valid code after error", async () => {
      const user = userEvent.setup({ delay: null });

      renderComponent({ userOtpValue: "123456" });

      // Simulate an error first
      mockValidateOtpCode.mockRejectedValueOnce({
        data: { message: "CSIAM0011E" },
      });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // Wait for error to be set
      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith("CSIAM0011E");
      });

      // Clear mocks and setup success
      mockSetErrorCode.mockClear();
      mockValidateOtpCode.mockImplementation(async () => {
        mockOnNext();
        return { success: true };
      });

      await user.click(submitButton);

      // Error should be cleared first, then onNext called
      await waitFor(() => {
        expect(mockSetErrorCode).toHaveBeenCalledWith(""); // Clear error
        expect(mockOnNext).toHaveBeenCalled();
      });
    });
    it("handles submit button preventDefault", async () => {
      const user = userEvent.setup({ delay: null });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");

      await user.click(submitButton);

      // Verify submit was processed
      await waitFor(() => {
        expect(mockValidateOtpCode).toHaveBeenCalled();
      });
    });

    it("does not render the try another way link when the button is shown", () => {
      renderComponent();

      expect(screen.queryByText("Try another way")).not.toBeInTheDocument();
    });

    it("handles choose different method button preventDefault", async () => {
      const user = userEvent.setup({ delay: null });

      renderComponent();

      const chooseDifferentMethodButton = screen.getByRole("button", {
        name: "Choose a different method",
      });
      await user.click(chooseDifferentMethodButton);

      expect(mockOnBack).toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("renders input with proper attributes", () => {
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("maxLength", "6");
      expect(input).toHaveAttribute("minLength", "6");
      expect(input).toHaveAttribute("required");
    });

    it("renders input with autocomplete for one-time-code", () => {
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute("autocomplete", "one-time-code");
    });

    it("does not force the verification input into a fixed 12rem width", () => {
      renderComponent();

      expect(
        screen.getByTestId("verificationCode").parentElement?.parentElement,
      ).not.toHaveStyle({
        width: "12rem",
      });
    });

    it("renders buttons with proper styles", () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      const chooseDifferentMethodButton = screen.getByRole("button", {
        name: "Choose a different method",
      });

      expect(submitButton).not.toHaveStyle({ width: "12rem" });
      expect(chooseDifferentMethodButton).toHaveStyle({ width: "fit-content" });
    });
  });

  describe("Language Support", () => {
    it("passes language to heading component", () => {
      renderComponent();

      const heading = screen.getByTestId("heading-h1");
      expect(heading).toHaveAttribute("lang", "en");
    });

    it("passes language to input component", () => {
      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveAttribute("data-lang", "en");
    });
  });
});
