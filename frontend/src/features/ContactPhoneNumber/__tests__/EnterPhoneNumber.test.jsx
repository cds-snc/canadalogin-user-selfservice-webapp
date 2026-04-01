import { BrowserRouter } from "react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EnterPhoneNumber from "../components/EnterPhoneNumber";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import "@testing-library/jest-dom/vitest";

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsDetails: ({ children, detailsTitle, ...props }) => (
    <details data-testid="gcds-details" {...props}>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
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
  GcdsHeading: ({ children, tag, lang, ...props }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid="gcds-heading" lang={lang} {...props}>
        {children}
      </Tag>
    );
  },
  GcdsLink: ({ children, href, ...props }) => (
    <a data-testid="gcds-link" href={href} {...props}>
      {children}
    </a>
  ),
  GcdsText: ({ children, ...props }) => (
    <div data-testid="gcds-text" {...props}>
      {children}
    </div>
  ),
  GcdsRadios: ({ name, legend, hint, options, onGcdsChange, ...props }) => (
    <fieldset data-testid="gcds-radios" {...props}>
      <legend>{legend}</legend>
      {hint && <div data-testid="radio-hint">{hint}</div>}
      {options?.map((option, index) => (
        <div key={option.id || index}>
          <input
            type="radio"
            id={option.id}
            name={name}
            value={option.value}
            checked={option.checked}
            onChange={onGcdsChange}
            data-testid={`radio-${option.value}`}
          />
          <label htmlFor={option.id}>
            {option.label}
            {option.hint && (
              <span data-testid="option-hint">{option.hint}</span>
            )}
          </label>
        </div>
      ))}
    </fieldset>
  ),
  GcdsButton: ({
    children,
    onGcdsClick,
    disabled,
    buttonRole,
    style,
    ...props
  }) => (
    <button
      data-testid="gcds-button"
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
      style={style}
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
}));

// Mock react-phone-input-2
vi.mock("react-phone-input-2", () => ({
  default: ({ inputProps, specialLabel, value, className, onChange }) => (
    <div data-testid="phone-input-container">
      <label htmlFor="phone-input">{specialLabel}</label>
      <input
        {...inputProps}
        id="phone-input"
        data-testid="phone-input"
        value={value}
        onChange={(e) => {
          const phone = e.target.value.replace("+", "");
          const country = { countryCode: "CA", iso2: "ca" };
          const formatted = e.target.value;
          onChange(phone, country, e, formatted);
        }}
        className={className}
      />
    </div>
  ),
}));

// Mock libphonenumber-js
vi.mock("libphonenumber-js", () => ({
  isValidPhoneNumber: vi.fn((number) => {
    // Mock validation - return true for valid-looking phone numbers
    return number && number.length >= 10;
  }),
}));

// Mock functions
vi.mock("../../../utils/functions", () => ({
  getPageContent: (language, page) => {
    const mockContent = {
      EnterNewPhoneNumber: {
        1: "Enter your new phone number",
        2: "Your contact phone number helps us keep your account secure.",
        3: "What services are accessing your contact phone number?",
        4: "Service 1",
        5: "Service 2",
        6: "Service 3",
        7: "Learn more about",
        8: "which services access your contact phone number",
        10: "Enter phone number",
        11: "My country is not listed",
        12: "If your country is not listed, you can still add your phone number.",
        13: "How would you like to receive your verification code?",
        14: "Please enter a valid phone number",
        15: "Choose how you'd like to receive your verification code.",
      },
      OtpSelection: {
        5: "How would you like to receive your verification code?",
        7: "Text message",
        8: "We'll send a 6-digit code to your phone via text message",
        9: "Voice call",
        10: "We'll call your phone with a 6-digit code",
        13: "Both options will send a verification code to the phone number you entered above.",
      },
      Button: {
        submit: "Continue",
        cancel: "Cancel",
      },
      ServicesWithAccessInfo: {
        1: "What services are accessing your {information}?",
        2: "Your {information} helps us keep your account secure.",
        3: "Test Service",
        4: "Learn more about {information} access",
        5: "Learn more about",
        6: "which services access your contact information",
        7: "name",
        8: "contact phone number",
        9: "language preference",
      },
    };
    return mockContent[page] || {};
  },
  getContentWithVariables: vi.fn((content, variables = {}) => {
    if (!content) {
      return "";
    }
    return Object.keys(variables).reduce(
      (result, key) =>
        result.replace(new RegExp(`{${key}}`, "g"), variables[key]),
      content,
    );
  }),
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
vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    SERVICES: [{ id: 1, title: "Test Service", description: "", url: "#" }],
    countryMapping: {
      countries: ["ca", "us"],
      localization: {
        "United States": "United States",
        Canada: "Canada",
      },
      frLocalization: {
        "United States": "États-Unis",
        Canada: "Canada",
      },
    },
  };
});

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
  relyingPartyInfo: {
    icon: "test-icon.png",
    id: "test-service-id",
    linkName: "Test Service",
    url: "https://test-service.example.com",
  },
  authenticatedPages: [],
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider initial={mockUserState}>
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("EnterPhoneNumber Component", () => {
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnChangePhoneForm = vi.fn();
  const mockSetErrorCode = vi.fn();

  const defaultProps = {
    onNext: mockOnNext,
    onCancel: mockOnCancel,
    onChangePhoneForm: mockOnChangePhoneForm,
    phoneFormData: {
      phoneNumber: "",
      otpType: "smsotp",
      formattedPhoneNumber: "",
    },
    errorMessage: "",
    setErrorCode: mockSetErrorCode,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the component with correct heading and text", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Enter your new phone number",
    );
    // Use getAllByText to get all instances, then check the first one (main content)
    const secureTexts = screen.getAllByText(
      "Your contact phone number helps us keep your account secure.",
    );
    expect(secureTexts).toHaveLength(2); // One in main content, one in details
    expect(secureTexts[0]).toBeInTheDocument();
  });

  it("renders the phone input with correct label", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("phone-input")).toBeInTheDocument();
    expect(screen.getByText("Enter phone number")).toBeInTheDocument();
  });

  it("renders radio buttons for OTP selection", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-radios")).toBeInTheDocument();
    expect(screen.getByTestId("radio-smsotp")).toBeInTheDocument();
    expect(screen.getByTestId("radio-voiceotp")).toBeInTheDocument();
    expect(screen.getByText("Text message")).toBeInTheDocument();
    expect(screen.getByText("Voice call")).toBeInTheDocument();
  });

  it("calls onChangePhoneForm when phone number changes", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });

    expect(mockOnChangePhoneForm).toHaveBeenCalledWith(
      "phoneNumber",
      "+15551234567",
    );
    expect(mockOnChangePhoneForm).toHaveBeenCalledWith(
      "formattedPhoneNumber",
      "+15551234567",
    );
  });

  it("calls onChangePhoneForm when OTP type changes", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const voiceRadio = screen.getByTestId("radio-voiceotp");
    fireEvent.click(voiceRadio);

    expect(mockOnChangePhoneForm).toHaveBeenCalledWith("otpType", "voiceotp");
  });

  it("clears error code when phone number changes", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });

    expect(mockSetErrorCode).toHaveBeenCalledWith("");
  });

  it("clears error code when OTP type changes", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const voiceRadio = screen.getByTestId("radio-voiceotp");
    fireEvent.click(voiceRadio);

    expect(mockSetErrorCode).toHaveBeenCalledWith("");
  });

  it("displays error message when provided", () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Invalid phone number",
    };

    render(
      <TestWrapper>
        <EnterPhoneNumber {...propsWithError} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-error-message")).toHaveTextContent(
      "Invalid phone number",
    );
  });

  it("disables continue button when phone number is invalid", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    // Simulate entering an invalid phone number
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "123" } });

    const continueButtons = screen.getAllByTestId("gcds-button");
    const continueButton = continueButtons.find((btn) =>
      btn.textContent.includes("Continue"),
    );

    expect(continueButton).toBeDisabled();
  });

  it("calls onNext when continue button is clicked with valid phone", async () => {
    // Provide props with valid phone number data to enable the button
    const propsWithValidPhone = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        phoneNumber: "+15551234567",
        formattedPhoneNumber: "+1 555 123-4567",
      },
    };

    render(
      <TestWrapper>
        <EnterPhoneNumber {...propsWithValidPhone} />
      </TestWrapper>,
    );

    await waitFor(() => {
      const continueButtons = screen.getAllByTestId("gcds-button");
      const continueButton = continueButtons.find((btn) =>
        btn.textContent.includes("Continue"),
      );
      expect(continueButton).not.toBeDisabled();
    });

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
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const cancelButtons = screen.getAllByTestId("gcds-button");
    const cancelButton = cancelButtons.find((btn) =>
      btn.textContent.includes("Cancel"),
    );
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("renders services accessing phone number details", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText(
        "What services are accessing your contact phone number?",
      ),
    ).toBeInTheDocument();
    expect(screen.getAllByTestId("gcds-details")).toHaveLength(2);
  });

  it("renders country not listed section", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText("My country is not listed")).toBeInTheDocument();
  });

  it("shows SMS option as checked by default", () => {
    render(
      <TestWrapper>
        <EnterPhoneNumber {...defaultProps} />
      </TestWrapper>,
    );

    const smsRadio = screen.getByTestId("radio-smsotp");
    expect(smsRadio).toBeChecked();
  });

  it("shows correct option as checked based on phoneFormData", () => {
    const propsWithVoice = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        otpType: "voiceotp",
      },
    };

    render(
      <TestWrapper>
        <EnterPhoneNumber {...propsWithVoice} />
      </TestWrapper>,
    );

    const voiceRadio = screen.getByTestId("radio-voiceotp");
    expect(voiceRadio).toBeChecked();
  });
});
