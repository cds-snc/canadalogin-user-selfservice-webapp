import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import UpdateProfileName from "../components/ProfileUpdateName.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
import "@testing-library/jest-dom/vitest";

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({
    children,
    buttonId,
    onGcdsClick,
    disabled,
    buttonType,
    buttonRole,
    ...props
  }) => (
    <button
      data-testid={buttonId}
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-type={buttonType}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsText: ({ marginTop, marginBottom, children, ...props }) => (
    <p
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </p>
  ),
  GcdsIcon: ({ name, size, className }) => (
    <div
      data-testid="warning-icon"
      data-icon-name={name}
      data-icon-size={size}
      className={className}
    />
  ),
  GcdsInput: ({ inputId, ...props }) => {
    const { name, type, value, onInput, ...domProps } = props;
    return (
      <input
        {...domProps}
        id={inputId}
        name={name}
        type={type}
        value={value}
        onInput={onInput}
        data-testid={props["data-testid"]}
      />
    );
  },
  GcdsErrorMessage: ({ children, messageId, ...props }) => (
    <div {...props} data-testid="error-message" id={messageId}>
      {children}
    </div>
  ),

  GcdsContainer: ({ children, marginTop, marginBottom, ...props }) => {
    const style = {
      ...(marginTop && { marginTop }),
      ...(marginBottom && { marginBottom }),
      ...props.style,
    };
    return (
      <div {...props} style={style}>
        {children}
      </div>
    );
  },
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ marginTop, marginBottom, children, ...props }) => (
    <h1
      {...props}
      style={{
        marginTop: marginTop,
        marginBottom: marginBottom,
        ...props.style,
      }}
    >
      {children}
    </h1>
  ),
  GcdsDetails: ({ children, ...props }) => (
    <details {...props}>{children}</details>
  ),
}));

vi.mock("../../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "Are you sure you want to update your name?",
    2: "You’ve requested to update your name to:",
    3: "Example Newname",
    4: "This will update your name with the following services:",
    5: "GEO.ca",
    6: "Heads up",
    7: "This",
    8: "Yes, update",
    9: "Cancel",
    10: "Digital Talent",
    11: "does not",
    12: "legally change your name.",
  }),
}));

vi.mock("../../../components/InfoBlocks/ServicesWithAccessInfoSection", () => ({
  default: () => (
    <div data-testid="services-with-access-info">
      <p>Mocked Services Info Section</p>
      <ul>
        <li>Test content for item 3</li>
      </ul>
    </div>
  ),
}));

// Mock the navigation hook
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
  };
});

// Mock the redirect function to prevent navigation errors
vi.mock("../../../utils/apiErrorHandler", () => ({
  redirectToLogin: vi.fn(),
  handleApiError: vi.fn(),
}));

const mockSessionTimeoutState = {
  showModal: false,
  isLoading: false,
  expirationTime: null,
  newServerSideExpirationTime: null,
};

const mockUpdateUserName = {
  firstName: "New",
  lastName: "User",
  formatted: "New User",
};

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    emailLanguage: null,
    emailValidated: true,
    trxnId: null,
    passwordSubmitted: false,
    phone: null,
    stepVerificationSent: false,
    stepVerified: false,
    viewPrivacy: false,
    id: "test-user-123",
    otpType: null,
    passwordValidated: false,
  },
  userProfile: {
    id: "test-user-123",
    active: true,
    details: {
      emailVerified: true,
      lastLogin: "2025-09-08T12:00:00Z",
      lastMFA: "2025-09-08T12:00:00Z",
      twoFactorAuthentication: true,
      pwdChangedTime: "2025-09-08T12:00:00Z",
    },
    emails: [{ value: "test@example.com", type: "primary" }],
    phoneNumbers: [{ value: "+1234567890", type: "primary" }],
    meta: {
      created: "2025-09-08T12:00:00Z",
      location: "test",
      lastModified: "2025-09-08T12:00:00Z",
      resourceType: "User",
    },
    userName: "testuser",
    preferredLanguage: "en",
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
    <UserProvider
      initial={mockUserState}
      initialSessionTimeoutState={mockSessionTimeoutState}
    >
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("UpdateProfileName Component", () => {
  const mockOnNameFormChange = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockSetErrorCode = vi.fn();

  const defaultProps = {
    nameFormData: {
      givenName: "",
      familyName: "",
    },
    onNameFormChange: mockOnNameFormChange,
    onNext: mockOnNext,
    onCancel: mockOnCancel,
    setErrorCode: mockSetErrorCode,
    errorMessage: "",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
  });

  it("calls onNameFormChange when user types in inputs", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Initially inputs should be empty
    expect(firstNameInput).toHaveValue("");
    expect(lastNameInput).toHaveValue("");

    // Simulate typing in first name
    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: mockUpdateUserName.firstName },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith(
      "givenName",
      mockUpdateUserName.firstName,
    );

    // Simulate typing in last name
    fireEvent.input(lastNameInput, {
      target: { name: "familyName", value: mockUpdateUserName.lastName },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith(
      "familyName",
      mockUpdateUserName.lastName,
    );
  });

  it("calls onNext when Continue button is clicked", async () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const submitButton = screen.getByRole("button", { name: /continue/i });
    fireEvent.click(submitButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when Cancel button is clicked", async () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("displays error message when provided", () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Test error message",
    };

    render(
      <TestWrapper>
        <UpdateProfileName {...propsWithError} />
      </TestWrapper>,
    );

    expect(screen.getByText("Test error message")).toBeInTheDocument();
  });

  it("clears error when user starts typing", () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Test error message",
    };

    render(
      <TestWrapper>
        <UpdateProfileName {...propsWithError} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");

    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: "New" },
    });

    expect(mockSetErrorCode).toHaveBeenCalledWith("");
  });

  it("displays form values from props", () => {
    const propsWithData = {
      ...defaultProps,
      nameFormData: {
        givenName: "John",
        familyName: "Doe",
      },
    };

    render(
      <TestWrapper>
        <UpdateProfileName {...propsWithData} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    expect(firstNameInput).toHaveValue("John");
    expect(lastNameInput).toHaveValue("Doe");
  });

  it("prevents invalid characters in name inputs", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Test invalid characters (numbers, special characters) - they get filtered out
    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: "John123" },
    });

    // onNameFormChange should be called with filtered value (numbers removed and capitalized)
    expect(mockOnNameFormChange).toHaveBeenCalledWith("givenName", "John");

    fireEvent.input(lastNameInput, {
      target: { name: "familyName", value: "Doe@#$" },
    });

    // onNameFormChange should be called with filtered value (symbols removed)
    expect(mockOnNameFormChange).toHaveBeenCalledWith("familyName", "Doe");
  });

  it("allows valid characters in name inputs", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Test valid characters (letters, spaces, hyphens, apostrophes)
    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: "Jean-Pierre" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith(
      "givenName",
      "Jean-Pierre",
    );

    fireEvent.input(lastNameInput, {
      target: { name: "familyName", value: "O'Connor" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith("familyName", "O'Connor");
  });

  it("allows international characters in name inputs", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Test international characters - should be capitalized
    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: "josé" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith("givenName", "José");

    fireEvent.input(lastNameInput, {
      target: { name: "familyName", value: "müller" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith("familyName", "Müller");
  });

  it("capitalizes first letter of names", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");
    const lastNameInput = screen.getByTestId("familyName");

    // Test lowercase input - should be capitalized
    fireEvent.input(firstNameInput, {
      target: { name: "givenName", value: "john" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith("givenName", "John");

    // Test hyphenated names - each part should be capitalized
    fireEvent.input(lastNameInput, {
      target: { name: "familyName", value: "smith-jones" },
    });

    expect(mockOnNameFormChange).toHaveBeenCalledWith(
      "familyName",
      "Smith-Jones",
    );
  });

  it("allows valid characters to be typed via keydown", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");

    // Test valid characters being typed
    const validKeyDownEvent = {
      key: "a",
      target: { name: "givenName" },
      preventDefault: vi.fn(),
    };

    fireEvent.keyDown(firstNameInput, validKeyDownEvent);
    expect(validKeyDownEvent.preventDefault).not.toHaveBeenCalled();

    const validKeyDownEvent2 = {
      key: "-",
      target: { name: "givenName" },
      preventDefault: vi.fn(),
    };

    fireEvent.keyDown(firstNameInput, validKeyDownEvent2);
    expect(validKeyDownEvent2.preventDefault).not.toHaveBeenCalled();
  });

  it("allows control keys and special keys", () => {
    render(
      <TestWrapper>
        <UpdateProfileName {...defaultProps} />
      </TestWrapper>,
    );

    const firstNameInput = screen.getByTestId("givenName");

    // Test control keys (should not be prevented)
    const controlKeyEvent = {
      key: "Backspace",
      target: { name: "givenName" },
      preventDefault: vi.fn(),
    };

    fireEvent.keyDown(firstNameInput, controlKeyEvent);
    expect(controlKeyEvent.preventDefault).not.toHaveBeenCalled();

    const ctrlKeyEvent = {
      key: "v",
      ctrlKey: true,
      target: { name: "givenName" },
      preventDefault: vi.fn(),
    };

    fireEvent.keyDown(firstNameInput, ctrlKeyEvent);
    expect(ctrlKeyEvent.preventDefault).not.toHaveBeenCalled();
  });
});
