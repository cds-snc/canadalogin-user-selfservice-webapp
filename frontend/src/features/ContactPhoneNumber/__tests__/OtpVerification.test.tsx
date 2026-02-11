import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { FLOW_TYPES } from "../../../utils/constants";
import OtpVerification from "../components/OtpVerification";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom/vitest";

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, columns, gap, ...props }) => (
    <div
      data-testid="gcds-grid"
      style={{ gridTemplateColumns: columns, gap }}
      {...props}
    >
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid="gcds-heading" {...props}>
        {children}
      </Tag>
    );
  },
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
  ),
  GcdsInput: ({ inputId, label, value, onGcdsInput, maxLength, ...props }) => (
    <div>
      <label htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        data-testid="gcds-input"
        value={value}
        onChange={(e) => onGcdsInput?.(e)}
        maxLength={maxLength}
        {...props}
      />
    </div>
  ),
  GcdsButton: ({ children, onGcdsClick, disabled, buttonRole, ...props }) => (
    <button
      data-testid="gcds-button"
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsErrorMessage: ({ children, messageId, ...props }) => (
    <div data-testid="gcds-error-message" id={messageId} {...props}>
      {children}
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick, ...props }) => (
    <a data-testid="gcds-link" onClick={onGcdsClick} {...props}>
      {children}
    </a>
  ),
}));

// Mock functions
vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: (language, page) => {
    const mockContent = {
      Verification: {
        1: "Check your phone",
        2: "We have sent a 6-digit verification code via text message to +1 (555) 123-4567",
        3: "We have sent a 6-digit verification code via voice call to +1 (555) 123-4567",
        4: "Enter 6-digit verification code",
        5: "Request a new code",
        6: "Use a different phone number",
        7: "Resend",
        8: "Enter verification code",
        9: "Verification code",
        10: "Didn't receive a code?",
        14: "You can request a new code in",
        15: "seconds",
        16: "Request a new code",
        21: "Use a different phone number",
      },
      Button: {
        submit: "Continue",
        cancel: "Cancel",
        back: "Back",
      },
    };
    return mockContent[page] || {};
  },
}));

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

// Mock constants
vi.mock("../../../utils/constants.jsx", async () => {
  const actual = await vi.importActual("../../../utils/constants.jsx");
  return {
    ...actual,
    SERVICES: [{ id: 1, title: "Test Service", description: "", url: "#" }],
  };
});

// Mock libphonenumber-js for phone formatting
vi.mock("libphonenumber-js", () => ({
  default: vi.fn(),
}));

import parsePhoneNumberFromString from "libphonenumber-js";

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    id: "test-user-123",
  },
  userProfile: {
    id: "test-user-123",
    userName: "testuser",
    name: {
      givenName: "John",
      familyName: "Doe",
      formatted: "John Doe",
    },
  },
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider initial={mockUserState}>
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("OtpVerification Component", () => {
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnBack = vi.fn();
  const mockOnChangePhoneForm = vi.fn();
  const mockRequestNewOtpCode = vi.fn();
  const mockSetErrorCode = vi.fn();

  const defaultProps = {
    onNext: mockOnNext,
    onCancel: mockOnCancel,
    onBack: mockOnBack,
    onChangePhoneForm: mockOnChangePhoneForm,
    requestNewOtpCode: mockRequestNewOtpCode,
    setErrorCode: mockSetErrorCode,
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      otpType: FLOW_TYPES.sms,
      otp: "",
    },
    errorMessage: "",
    userProfile: {
      userName: "testuser",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    parsePhoneNumberFromString.mockImplementation((phoneNumber) => {
      if (phoneNumber === "+15551234567") {
        return { formatNational: () => "(555) 123-4567" };
      }
      return null;
    });
  });

  it("renders the component with correct heading", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Check your phone",
    );
  });

  it("displays SMS message when otpType is sms", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    // The SMS message should be displayed - mock content key "2"
    expect(
      screen.getByText(
        "We have sent a 6-digit verification code via text message to +1 (555) 123-4567",
      ),
    ).toBeInTheDocument();
  });

  it("displays voice message when otpType is voice", () => {
    const propsWithVoice = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        otpType: FLOW_TYPES.voice,
      },
    };

    render(
      <TestWrapper>
        <OtpVerification {...propsWithVoice} />
      </TestWrapper>,
    );

    expect(screen.getByText(/voice call/i)).toBeInTheDocument();
  });

  it("renders OTP input field", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    const otpInput = screen.getByTestId("gcds-input");
    expect(otpInput).toBeInTheDocument();
    expect(otpInput).toHaveAttribute("maxLength", "6");
  });

  it("calls onChangePhoneForm when OTP input changes", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    const otpInput = screen.getByTestId("gcds-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    expect(mockOnChangePhoneForm).toHaveBeenCalledWith("otp", "123456");
  });

  it("clears error when OTP input changes", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    const otpInput = screen.getByTestId("gcds-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    expect(mockSetErrorCode).toHaveBeenCalledWith("");
  });

  it("displays error message when provided", () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Invalid verification code",
    };

    render(
      <TestWrapper>
        <OtpVerification {...propsWithError} />
      </TestWrapper>,
    );

    // Error message is passed to input as errormessage attribute
    expect(screen.getByTestId("gcds-input")).toHaveAttribute(
      "errormessage",
      "Invalid verification code",
    );
  });

  it("disables continue button when OTP is empty", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    const continueButtons = screen.getAllByTestId("gcds-button");
    const continueButton = continueButtons.find((btn) =>
      btn.textContent.includes("Continue"),
    );

    expect(continueButton).toBeDisabled();
  });

  it("enables continue button when OTP has 6 digits", () => {
    const propsWithOtp = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        otp: "123456",
      },
    };

    render(
      <TestWrapper>
        <OtpVerification {...propsWithOtp} />
      </TestWrapper>,
    );

    const continueButtons = screen.getAllByTestId("gcds-button");
    const continueButton = continueButtons.find((btn) =>
      btn.textContent.includes("Continue"),
    );

    expect(continueButton).not.toBeDisabled();
  });

  it("calls onNext when continue button is clicked", () => {
    const propsWithOtp = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        otp: "123456",
      },
    };

    render(
      <TestWrapper>
        <OtpVerification {...propsWithOtp} />
      </TestWrapper>,
    );

    const continueButtons = screen.getAllByTestId("gcds-button");
    const continueButton = continueButtons.find((btn) =>
      btn.textContent.includes("Continue"),
    );
    fireEvent.click(continueButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    const cancelButtons = screen.getAllByTestId("gcds-button");
    const cancelButton = cancelButtons.find((btn) =>
      btn.textContent.includes("Cancel"),
    );
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("calls onBack when back button is clicked", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    // The back action is in the second link (getAllByText returns array)
    const backLinks = screen.getAllByText("Use a different phone number");
    const backLink = backLinks[backLinks.length - 1]; // Take the last one
    fireEvent.click(backLink);

    expect(mockOnBack).toHaveBeenCalledTimes(1);
  });

  it("displays formatted phone number using libphonenumber", () => {
    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    // Should use the formatted number from the mock - check the strong element specifically
    const phoneNumberElements = screen.getAllByText(/\(555\) 123-4567/);
    expect(phoneNumberElements.length).toBeGreaterThan(0);
    // The formatted phone number should appear in a strong tag
    const strongPhoneNumber = phoneNumberElements.find(
      (el) => el.tagName === "STRONG",
    );
    expect(strongPhoneNumber).toBeInTheDocument();
  });

  it("falls back to original phone number if formatting fails", () => {
    parsePhoneNumberFromString.mockImplementation(() => {
      throw new Error("Parsing failed");
    });

    render(
      <TestWrapper>
        <OtpVerification {...defaultProps} />
      </TestWrapper>,
    );

    // Should fall back to the formatted phone number from props - check the strong element specifically
    const phoneNumberElements = screen.getAllByText(/\+1 \(555\) 123-4567/);
    expect(phoneNumberElements.length).toBeGreaterThan(0);
    // The formatted phone number should appear in a strong tag
    const strongPhoneNumber = phoneNumberElements.find(
      (el) => el.tagName === "STRONG",
    );
    expect(strongPhoneNumber).toBeInTheDocument();
  });

  it("displays current OTP value in input", () => {
    const propsWithOtp = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        otp: "123456",
      },
    };

    render(
      <TestWrapper>
        <OtpVerification {...propsWithOtp} />
      </TestWrapper>,
    );

    const otpInput = screen.getByTestId("gcds-input");
    expect(otpInput).toHaveValue("123456");
  });
});
