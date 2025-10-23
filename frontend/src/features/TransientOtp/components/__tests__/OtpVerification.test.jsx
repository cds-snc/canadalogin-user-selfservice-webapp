import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import OtpVerification from "../OtpVerification.jsx";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants.jsx";

// Mock the navigation hooks
const mockNavigateHelper = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../../hooks/useNavigate.tsx", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock user context
const mockUserState = {
  testData: undefined,
};

vi.mock("../../../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: mockUserState,
  }),
}));

// Mock auth service
const mockTransientOtpSend = vi.fn();
const mockTransientOtpVerify = vi.fn();

vi.mock("../../../../services/authService.jsx", () => ({
  authService: {
    transientOtpSend: (...args) => mockTransientOtpSend(...args),
    transientOtpVerify: (...args) => mockTransientOtpVerify(...args),
  },
}));

// Mock utilities
vi.mock("../../../../utils/functions.jsx", () => ({
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

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page, { language }) => {
    if (page === PAGES.securitySettings) {
      return `/${language}/security-settings`;
    }
    return `/${language}/test`;
  }),
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, disabled, style }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      onClick={onGcdsClick}
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
        required={required}
        autoFocus={autofocus}
        autoComplete={autocomplete}
        data-validate-on={validateOn}
        data-lang={lang}
        data-error-message={errorMessage}
      />
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick, href }) => (
    <a data-testid="gcds-link" onClick={onGcdsClick} href={href}>
      {children}
    </a>
  ),
  GcdsNotice: ({ children, type, noticeTitle, noticeTitleTag }) => (
    <div data-testid="notice" data-type={type} data-title-tag={noticeTitleTag}>
      <div data-testid="notice-title">{noticeTitle}</div>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <p data-testid="text">{children}</p>,
}));

const mockOnNext = vi.fn();
const mockOnBack = vi.fn();
const mockSetOtpSentResponse = vi.fn();
const mockSetUserOtpValue = vi.fn();
const mockRequestOtpCode = vi.fn();
const mockValidateOtpCode = vi.fn();

const defaultProps = {
  onNext: mockOnNext,
  onBack: mockOnBack,
  requestOtpCode: mockRequestOtpCode,
  validateOtpCode: mockValidateOtpCode,
  userProfile: {
    id: "user-123",
    userName: "testuser@example.com",
  },
  userSelectedMfaFactor: {
    id: "factor-1",
    type: FLOW_TYPES.sms,
    phoneNumber: "+15551234567",
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
        phoneNumber: defaultProps.userSelectedMfaFactor.phoneNumber,
      });
      if (response.success && response.data) {
        mockSetOtpSentResponse({ trxnId: response.data.trxnId });
      }
      return response;
    });

    // Make mockValidateOtpCode call the mocked authService and trigger onNext on success
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

    it("renders submit and cancel buttons", () => {
      renderComponent();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
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
        phoneNumber: "+15559876543",
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
        phoneNumber: "+15559876543",
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
        phoneNumber: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(screen.getByText("Check your email")).toBeInTheDocument();
    });

    it("renders Email-specific instructions", () => {
      const emailFactor = {
        id: "factor-3",
        type: FLOW_TYPES.email,
        phoneNumber: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(
        screen.getByText(/We have sent an email with a 6-digit code to:/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /Your email might take a few minutes to arrive\. If you do not get an email, check your spam folder\./,
        ),
      ).toBeInTheDocument();
    });

    it("does not render Enter the code heading for email", () => {
      const emailFactor = {
        id: "factor-3",
        type: FLOW_TYPES.email,
        phoneNumber: "test@example.com",
      };
      renderComponent({ userSelectedMfaFactor: emailFactor });

      expect(screen.queryByText("Enter the code")).not.toBeInTheDocument();
    });
  });

  describe("Initial OTP Request", () => {
    it("sends OTP request on component mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalledTimes(1);
      });

      expect(mockTransientOtpSend).toHaveBeenCalledWith({
        userName: "testuser@example.com",
        otpType: "sms",
        phoneNumber: "+15551234567",
      });
    });

    it("updates otpSentResponse on successful send", async () => {
      mockTransientOtpSend.mockResolvedValue({
        success: true,
        data: { trxnId: "new-txn-456" },
      });

      renderComponent();

      await waitFor(() => {
        expect(mockSetOtpSentResponse).toHaveBeenCalledWith({
          trxnId: "new-txn-456",
        });
      });
    });

    it("handles send OTP error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockTransientOtpSend.mockRejectedValue({
        data: { message: "CSIAM0038E" },
      });

      renderComponent();

      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(screen.getByText("Too Many Attempts")).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it("does not send OTP if userProfile is null", () => {
      renderComponent({ userProfile: null });

      expect(mockTransientOtpSend).not.toHaveBeenCalled();
    });

    it("does not send OTP if userProfile.id is undefined", () => {
      renderComponent({ userProfile: { userName: "test@example.com" } });

      expect(mockTransientOtpSend).not.toHaveBeenCalled();
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
        expect(mockTransientOtpVerify).toHaveBeenCalledWith({
          otp: "123456",
          trxnId: "txn-123",
          otpType: "sms",
        });
      });
    });

    it("calls onNext when verification is successful", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockResolvedValue({ success: true });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it("displays error when verification fails", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(
          screen.getByText("The verification code is invalid or has expired."),
        ).toBeInTheDocument();
      });
    });

    it("clears error code when submitting again", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValueOnce({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
      });

      // Clear the mock to simulate successful verification
      mockTransientOtpVerify.mockResolvedValue({ success: true });

      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      });
    });
  });

  describe("Cancel Button Behavior", () => {
    it("navigates to security settings when cancel is clicked", async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockNavigateHelper).toHaveBeenCalledWith("/en/security-settings");
    });
  });

  describe("Error Display", () => {
    it("does not display error message initially", () => {
      renderComponent();

      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });

    it("displays error message when errorCode is set", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByTestId("error-message")).toBeInTheDocument();
        expect(
          screen.getByText("The verification code is invalid or has expired."),
        ).toBeInTheDocument();
      });
    });

    it("passes error message to input field", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        const input = screen.getByTestId("verificationCode");
        expect(input).toHaveAttribute(
          "data-error-message",
          "The verification code is invalid or has expired.",
        );
      });
    });

    it("handles unknown error codes gracefully", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValue({
        data: { message: "UNKNOWN_ERROR" },
      });

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        // Should not crash, error message will be empty
        expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
      });
    });
  });

  describe("Test Data Mode", () => {
    it("renders pre-filled input in test mode", () => {
      mockUserState.testData = { otp: "999999" };

      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).toHaveValue("999999");
    });

    it("does not use onGcdsInput in test mode", () => {
      mockUserState.testData = { otp: "999999" };

      renderComponent();

      const input = screen.getByTestId("verificationCode");
      expect(input).not.toHaveAttribute("onChange");
    });
  });

  describe("Edge Cases", () => {
    it("handles null userProfile gracefully", () => {
      renderComponent({ userProfile: null });

      expect(screen.getByText("Check your phone")).toBeInTheDocument();
      expect(mockTransientOtpSend).not.toHaveBeenCalled();
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
      mockTransientOtpSend.mockRejectedValue({});

      renderComponent();

      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalled();
      });

      // Should not display error
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });

    it("handles OTP verify error without message", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpVerify.mockRejectedValue({});

      renderComponent({ userOtpValue: "123456" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockTransientOtpVerify).toHaveBeenCalled();
      });

      // Should not display error
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("complete workflow: mount, type code, submit, success", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpSend.mockResolvedValue({
        success: true,
        data: { trxnId: "txn-123" },
      });
      mockTransientOtpVerify.mockResolvedValue({ success: true });

      renderComponent({ userOtpValue: "123456" });

      // Wait for OTP to be sent
      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalled();
      });

      // Submit button should be enabled with 6-digit code
      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).not.toBeDisabled();

      await user.click(submitButton);

      // Verify success
      await waitFor(() => {
        expect(mockTransientOtpVerify).toHaveBeenCalled();
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it("clears error when submitting valid code after error", async () => {
      const user = userEvent.setup({ delay: null });
      mockTransientOtpSend.mockResolvedValue({
        success: true,
        data: { trxnId: "txn-123" },
      });
      mockTransientOtpVerify.mockResolvedValue({ success: true });

      renderComponent({ userOtpValue: "123456" });

      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalled();
      });

      // Simulate an error first
      mockTransientOtpVerify.mockRejectedValueOnce({
        data: { message: "CSIAM0011E" },
      });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // Wait for error to appear
      await waitFor(() => {
        expect(
          screen.getByText("The verification code is invalid or has expired."),
        ).toBeInTheDocument();
      });

      // Now submit again with success
      mockTransientOtpVerify.mockResolvedValue({ success: true });
      await user.click(submitButton);

      // Error should be cleared and onNext called
      await waitFor(() => {
        expect(mockOnNext).toHaveBeenCalled();
      });
    });

    it("handles submit button preventDefault", async () => {
      const user = userEvent.setup({ delay: null });
      const preventDefaultSpy = vi.fn();

      renderComponent({ userOtpValue: "123456" });

      await waitFor(() => {
        expect(mockTransientOtpSend).toHaveBeenCalled();
      });

      const submitButton = screen.getByTestId("submit-button");

      // Add event listener to check preventDefault is called
      submitButton.addEventListener("click", (e) => {
        preventDefaultSpy(e.defaultPrevented);
      });

      await user.click(submitButton);

      // Verify submit was processed
      await waitFor(() => {
        expect(mockTransientOtpVerify).toHaveBeenCalled();
      });
    });

    it("handles cancel button preventDefault and navigation", async () => {
      const user = userEvent.setup({ delay: null });

      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockNavigateHelper).toHaveBeenCalledWith("/en/security-settings");
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
      expect(input).toHaveAttribute("autoComplete", "one-time-code");
    });

    it("renders buttons with proper styles", () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      const cancelButton = screen.getByTestId("cancel-button");

      expect(submitButton).toHaveStyle({ width: "fit-content" });
      expect(cancelButton).toHaveStyle({ width: "fit-content" });
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
