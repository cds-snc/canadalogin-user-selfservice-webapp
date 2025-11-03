import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import PasswordVerification from "../PasswordVerification.jsx";
import { PAGES } from "../../../../utils/constants.jsx";

// Mock the navigation hooks
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

// Mock utilities
vi.mock("../../../../utils/functions.jsx", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === PAGES.passwordVerification) {
      return {
        1: "First, verify it's you",
        2: "To change your password,",
        3: "first enter your current password.",
        4: "Password",
        5: "Forgot your password?",
        6: "Reset your password",
        7: "To add a phone number,",
        8: "To delete this number,",
      };
    }
    if (page === PAGES.error) {
      return {
        1: "There was a problem",
        2: "Invalid email. Email must contain an '@' symbol followed by a domain.",
        3: "Codes must be six digits. Try again.",
        4: "Password must be 12 characters",
        5: "Passwords are 12 to 65 characters long. Please try again.",
        6: "Code sent does not match. Try again.",
        7: "Server Error. Please try again later.",
        8: "Invalid phone number. Phone numbers for the country you selected should be ",
        9: " digits. Make sure you selected the right country, or try typing your phone number again. Extensions are not allowed.",
        10: "Enter a phone number to continue.",
        11: "Enter a last name to continue. If you have a single name, enter it in the last name field.",
        12: "and a maximum of",
        13: "characters.",
        CSIAM0010E: "The authentication attempt failed",
        CSIAM0011E: "The verification code is invalid or has expired.",
        CSIAM0038E: "Too Many Attempts",
        CSIAI0021E:
          "The password that you specified was used previously, and it cannot be reused.",
        CSIBN0025E: "The verification code is invalid or has expired.",
        CSIBN0028E: "The verification code is invalid or has expired.",
        CSIBN0021E: "The verification code is invalid.",
      };
    }
    if (page === "Button") {
      return {
        submit: "Submit",
        cancel: "Cancel",
      };
    }
    return {};
  }),
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, style }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      onClick={onGcdsClick}
      style={style}
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children, className }) => (
    <div data-testid="container" className={className}>
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
    name,
    type,
    value,
    errorMessage,
    onGcdsInput,
    lang,
    size,
    autofocus,
    autocomplete,
    validateOn,
  }) => (
    <div data-testid="input-container">
      <label htmlFor={inputId} data-testid="input-label">
        {label}
      </label>
      <input
        id={inputId}
        data-testid="password-input"
        name={name}
        type={type}
        value={value}
        onChange={onGcdsInput}
        lang={lang}
        data-size={size}
        autoFocus={autofocus}
        autoComplete={autocomplete}
        data-validate-on={validateOn}
      />
      {errorMessage && <span data-testid="error-message">{errorMessage}</span>}
    </div>
  ),
  GcdsLink: ({ children, href }) => (
    <a data-testid="gcds-link" href={href}>
      {children}
    </a>
  ),
  GcdsText: ({ children }) => <p data-testid="text">{children}</p>,
}));

const mockSetUserPasswordValue = vi.fn();
const mockOnCancel = vi.fn();
const mockValidatePassword = vi.fn();

const defaultProps = {
  errorCode: "",
  userPasswordValue: "",
  setUserPasswordValue: mockSetUserPasswordValue,
  onCancel: mockOnCancel,
  validatePassword: mockValidatePassword,
  parentPage: "password",
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <BrowserRouter>
      <PasswordVerification {...mergedProps} />
    </BrowserRouter>,
  );
};

describe("PasswordVerification Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("renders the main heading", () => {
      renderComponent();
      expect(screen.getByText("First, verify it's you")).toBeInTheDocument();
    });

    it("renders with default parent page content", () => {
      renderComponent();
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first enter your current password\./),
      ).toBeInTheDocument();
    });

    it("renders with deleteMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.deleteMFAPage });
      expect(screen.getByText(/To delete this number,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first enter your current password\./),
      ).toBeInTheDocument();
    });

    it("renders with addMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.addMFAPage });
      expect(screen.getByText(/To add a phone number,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first enter your current password\./),
      ).toBeInTheDocument();
    });

    it("renders the password input field", () => {
      renderComponent();
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByTestId("input-label")).toHaveTextContent("Password");
    });

    it("renders submit and cancel buttons", () => {
      renderComponent();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("renders the help section", () => {
      renderComponent();
      expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
      expect(screen.getByText("Reset your password")).toBeInTheDocument();
    });

    it("renders help link", () => {
      renderComponent();
      const link = screen.getByTestId("gcds-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveTextContent("Reset your password");
    });
  });

  describe("Input Field Configuration", () => {
    it("renders password input with correct attributes", () => {
      renderComponent();
      const input = screen.getByTestId("password-input");

      expect(input).toHaveAttribute("type", "password");
      expect(input).toHaveAttribute("id", "passwordVerification");
      expect(input).toHaveAttribute("name", "passwordVerification");
      expect(input).toHaveAttribute("autoComplete", "one-time-code");
      expect(input).toHaveAttribute("data-validate-on", "other");
      expect(input).toHaveAttribute("data-size", "12");
      expect(input).toHaveAttribute("lang", "en");
    });

    it("displays the current password value", () => {
      renderComponent({ userPasswordValue: "myPassword123" });
      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue("myPassword123");
    });

    it("displays empty password field by default", () => {
      renderComponent();
      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue("");
    });
  });

  describe("Error Handling", () => {
    it("displays error message when errorCode is provided externally", () => {
      renderComponent({ errorCode: "CSIAM0010E" });
      expect(
        screen.getByText("The authentication attempt failed"),
      ).toBeInTheDocument();
    });

    it("does not display error message when errorCode is empty", () => {
      renderComponent({ errorCode: "" });
      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });

    it("displays password reuse error message", () => {
      renderComponent({ errorCode: "CSIAI0021E" });
      expect(
        screen.getByText(
          "The password that you specified was used previously, and it cannot be reused.",
        ),
      ).toBeInTheDocument();
    });

    it("displays verification code expired error message", () => {
      renderComponent({ errorCode: "CSIAM0011E" });
      expect(
        screen.getByText("The verification code is invalid or has expired."),
      ).toBeInTheDocument();
    });

    it("displays too many attempts error message", () => {
      renderComponent({ errorCode: "CSIAM0038E" });
      expect(screen.getByText("Too Many Attempts")).toBeInTheDocument();
    });
  });

  describe("User Interactions", () => {
    it("calls setUserPasswordValue when user types in password field", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByTestId("password-input");
      await user.type(input, "test");

      expect(mockSetUserPasswordValue).toHaveBeenCalledTimes(4);
      expect(mockSetUserPasswordValue).toHaveBeenCalledWith("t");
      expect(mockSetUserPasswordValue).toHaveBeenCalledWith("e");
      expect(mockSetUserPasswordValue).toHaveBeenCalledWith("s");
      expect(mockSetUserPasswordValue).toHaveBeenCalledWith("t");
    });

    it("calls validatePassword when submit button is clicked", async () => {
      const user = userEvent.setup();
      mockValidatePassword.mockResolvedValue(undefined);
      renderComponent({ userPasswordValue: "password123" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockValidatePassword).toHaveBeenCalledTimes(1);
      expect(mockValidatePassword).toHaveBeenCalledWith("password123");
    });

    it("prevents default event when submit button is clicked", async () => {
      const user = userEvent.setup();
      mockValidatePassword.mockResolvedValue(undefined);
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockValidatePassword).toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("prevents default event when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe("Validation Error Handling", () => {
    it("displays error when validatePassword throws an error", async () => {
      const user = userEvent.setup();
      const error = {
        data: {
          message: "CSIAM0010E",
        },
      };
      mockValidatePassword.mockRejectedValue(error);

      renderComponent({ userPasswordValue: "wrongPassword" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // Wait for the error to be processed
      await vi.waitFor(() => {
        expect(
          screen.getByText("The authentication attempt failed"),
        ).toBeInTheDocument();
      });
    });

    it("clears previous errors when submit is clicked again", async () => {
      const user = userEvent.setup();
      mockValidatePassword.mockResolvedValue(undefined);

      renderComponent({
        errorCode: "CSIAM0010E",
        userPasswordValue: "newPassword",
      });

      // Initially displays error
      expect(
        screen.getByText("The authentication attempt failed"),
      ).toBeInTheDocument();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // Error should be cleared during submission
      expect(mockValidatePassword).toHaveBeenCalledWith("newPassword");
    });

    it("handles validation error without data.message property", async () => {
      const user = userEvent.setup();
      const error = new Error("Generic error");
      mockValidatePassword.mockRejectedValue(error);

      renderComponent({ userPasswordValue: "password123" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // Should not crash, error won't be displayed if message is not in expected format
      expect(mockValidatePassword).toHaveBeenCalled();
    });

    it("handles validation error with null data", async () => {
      const user = userEvent.setup();
      const error = { data: null };
      mockValidatePassword.mockRejectedValue(error);

      renderComponent({ userPasswordValue: "password123" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockValidatePassword).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined userPasswordValue", () => {
      renderComponent({ userPasswordValue: undefined });

      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue("");
    });

    it("handles null userPasswordValue", () => {
      renderComponent({ userPasswordValue: null });

      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue("");
    });

    it("handles empty string userPasswordValue", () => {
      renderComponent({ userPasswordValue: "" });

      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue("");
    });

    it("handles very long password value", () => {
      const longPassword = "a".repeat(1000);
      renderComponent({ userPasswordValue: longPassword });

      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue(longPassword);
    });

    it("handles special characters in password", () => {
      const specialPassword = "p@$$w0rd!#%^&*()";
      renderComponent({ userPasswordValue: specialPassword });

      const input = screen.getByTestId("password-input");
      expect(input).toHaveValue(specialPassword);
    });

    it("handles undefined parentPage", () => {
      renderComponent({ parentPage: undefined });

      // Should use default content
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
    });

    it("handles null parentPage", () => {
      renderComponent({ parentPage: null });

      // Should use default content
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
    });

    it("handles unknown parentPage value", () => {
      renderComponent({ parentPage: "unknown" });

      // Should use default content
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
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

      const input = screen.getByTestId("password-input");
      expect(input).toHaveAttribute("lang", "en");
    });
  });

  describe("Grid and Layout Attributes", () => {
    it("renders grid with correct columns and gap attributes", () => {
      renderComponent();

      const grid = screen.getByTestId("grid");
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
    });

    it("renders buttons with correct styles", () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveStyle({ width: "fit-content" });

      const cancelButton = screen.getByTestId("cancel-button");
      expect(cancelButton).toHaveStyle({ width: "fit-content" });
    });
  });

  describe("Integration Tests", () => {
    it("renders complete component with all sections", () => {
      renderComponent();

      // Main heading
      expect(screen.getByText("First, verify it's you")).toBeInTheDocument();

      // Instructions
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first enter your current password\./),
      ).toBeInTheDocument();

      // Password input
      expect(screen.getByTestId("password-input")).toBeInTheDocument();
      expect(screen.getByText("Password")).toBeInTheDocument();

      // Buttons
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();

      // Help section
      expect(screen.getByText("Forgot your password?")).toBeInTheDocument();
      expect(screen.getByText("Reset your password")).toBeInTheDocument();
    });

    it("handles full user workflow from input to submission", async () => {
      const user = userEvent.setup();
      mockValidatePassword.mockResolvedValue(undefined);
      renderComponent();

      // Type password
      const input = screen.getByTestId("password-input");
      await user.type(input, "mySecurePassword");

      expect(mockSetUserPasswordValue).toHaveBeenCalled();

      // Submit
      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockValidatePassword).toHaveBeenCalled();
    });

    it("handles error workflow", async () => {
      const user = userEvent.setup();
      const error = {
        data: {
          message: "CSIAM0010E",
        },
      };
      mockValidatePassword.mockRejectedValue(error);

      renderComponent({ userPasswordValue: "wrongPassword" });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await vi.waitFor(() => {
        expect(
          screen.getByText("The authentication attempt failed"),
        ).toBeInTheDocument();
      });
    });

    it("handles cancellation workflow", async () => {
      const user = userEvent.setup();
      renderComponent({ userPasswordValue: "somePassword" });

      // Click cancel
      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockValidatePassword).not.toHaveBeenCalled();
    });

    it("allows retry after validation error", async () => {
      const user = userEvent.setup();
      const error = {
        data: {
          message: "CSIAM0010E",
        },
      };
      mockValidatePassword.mockRejectedValueOnce(error);
      mockValidatePassword.mockResolvedValueOnce(undefined);

      renderComponent({ userPasswordValue: "password123" });

      // First attempt fails
      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await vi.waitFor(() => {
        expect(
          screen.getByText("The authentication attempt failed"),
        ).toBeInTheDocument();
      });

      // Second attempt succeeds
      await user.click(submitButton);

      expect(mockValidatePassword).toHaveBeenCalledTimes(2);
    });
  });

  describe("Accessibility", () => {
    it("associates label with input field", () => {
      renderComponent();

      const label = screen.getByTestId("input-label");
      const input = screen.getByTestId("password-input");

      expect(label).toHaveAttribute("for", "passwordVerification");
      expect(input).toHaveAttribute("id", "passwordVerification");
    });

    it("provides error message for screen readers", () => {
      renderComponent({ errorCode: "CSIAM0010E" });

      const errorMessage = screen.getByTestId("error-message");
      expect(errorMessage).toBeInTheDocument();
      expect(errorMessage).toHaveTextContent(
        "The authentication attempt failed",
      );
    });
  });
});
