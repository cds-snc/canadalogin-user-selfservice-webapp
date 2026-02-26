import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import Password from "../Password";

// Mock the GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag = "h1", lang, ...props }) => {
    const Tag = tag;
    return (
      <Tag data-testid="gcds-heading" lang={lang} {...props}>
        {children}
      </Tag>
    );
  },
  GcdsText: ({ children, ...props }) => (
    <span data-testid="gcds-text" {...props}>
      {children}
    </span>
  ),
  GcdsDetails: ({ children, detailsTitle, ...props }) => (
    <details data-testid="gcds-details" {...props}>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
  ),
  GcdsInput: ({
    onGcdsInput,
    errorMessage,
    inputId,
    label,
    hint,
    type,
    minlength,
    maxlength,
    required,
    lang,
    name,
    ...props
  }) => (
    <div data-testid="gcds-input-wrapper">
      <label htmlFor={inputId}>{label}</label>
      {hint && <span data-testid="input-hint">{hint}</span>}
      <input
        id={inputId}
        name={name}
        data-testid="password-input"
        type={type}
        minLength={minlength}
        maxLength={maxlength}
        required={required}
        lang={lang}
        onChange={(e) => onGcdsInput && onGcdsInput(e)}
        onInput={(e) => onGcdsInput && onGcdsInput(e)}
        onPaste={(e) => {
          setTimeout(() => {
            if (onGcdsInput) {
              onGcdsInput({
                target: { value: e.target.value },
              });
            }
          }, 0);
        }}
        {...props}
      />
      {errorMessage && <span data-testid="error-message">{errorMessage}</span>}
    </div>
  ),
  GcdsCheckboxes: ({ onGcdsChange, options, legend, name, ...props }) => (
    <fieldset data-testid="gcds-checkboxes" {...props}>
      <legend>{legend}</legend>
      {options?.map((option) => (
        <label key={option.id}>
          <input
            type="checkbox"
            id={option.id}
            name={name}
            value={option.value}
            checked={option.checked}
            onChange={(e) => onGcdsChange && onGcdsChange(e)}
            data-testid={`checkbox-${option.id}`}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  ),
  GcdsGrid: ({ children, columns, gap, ...props }) => (
    <div
      data-testid="gcds-grid"
      data-columns={columns}
      data-gap={gap}
      {...props}
    >
      {children}
    </div>
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
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
      disabled={disabled}
      className={buttonRole}
      style={style}
      {...props}
    >
      {children}
    </button>
  ),
}));

// Mock utility functions
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    const mockContent = {
      password: {
        4: "Password must be at least",
        5: "minimum",
        6: "characters long",
        7: "Password requirements",
        8: "Your password must meet these requirements",
        9: "New password",
        10: "Enter your new password",
        11: "Show password",
        12: "Characters:",
        13: "minimum",
        14: "Change Password",
      },
      Button: {
        submit: "Submit",
        cancel: "Cancel",
      },
    };
    return mockContent[page] || {};
  }),
  getContentWithVariables: vi.fn((content, variables = {}) => {
    if (typeof content === "string") {
      let result = content;
      Object.keys(variables).forEach((key) => {
        const regex = new RegExp(`{${key}}`, "g");
        result = result.replace(regex, variables[key]);
      });
      return result;
    }
    return content || "";
  }),
}));

vi.mock("../../../../services/authService", () => ({
  authService: {
    requestPasswordPolicy: vi.fn().mockResolvedValue({
      success: true,
      data: {
        pwdMinLength: 12,
        pwdMaxLength: 110,
      },
    }),
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
    finalStep: vi.fn(),
  },
}));

// Mock constants
vi.mock("../../../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    PAGES: {
      password: "password",
      securitySettings: "securitySettings",
    },
  };
});

// Mock route helpers
vi.mock("../../../../utils/routeHelpers", () => ({
  path: vi.fn((page, params) => `/${params.language}/${page}`),
}));

// Mock password update API
vi.mock("../../api/passwordUpdate", () => ({
  passwordUpdate: {
    finalStep: vi.fn(),
  },
}));

// Mock react-router hooks
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => ({ language: "en" })),
    useNavigate: vi.fn(() => vi.fn()),
  };
});

describe("Password Component", () => {
  const defaultProps = {
    onNext: vi.fn(),
    otpSentResponse: { trxId: "test-transaction-123" },
    userOtpValue: "123456",
    setErrorCode: vi.fn(),
    errorMessage: "",
    setLocalLoading: vi.fn(),
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <Password {...defaultProps} {...props} />
      </BrowserRouter>,
    );
  };

  let mockAuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Get reference to the mocked service
    const { authService } = await import(
      "../../../../services/authService"
    );
    mockAuthService = authService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Component Rendering", () => {
    it("renders the password change form", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
        expect(screen.getByTestId("password-input")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button")).toBeInTheDocument();
        expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      });
    });

    it("displays character counter", async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText("Characters:")).toBeInTheDocument();
        expect(screen.getByText("0")).toBeInTheDocument();
        // Check that the character counter shows the pattern: "/ 12 minimum"
        expect(screen.getByText("/ 12", { exact: false })).toBeInTheDocument();
      });
    });
  });

  describe("Password Input", () => {
    it("updates character count when typing", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");
      fireEvent.change(passwordInput, { target: { value: "test123456789" } });

      await waitFor(() => {
        expect(screen.getByText("13")).toBeInTheDocument();
      });
    });

    it("enables submit button when password meets minimum length", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, {
        target: { value: "validPassword123" },
      });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it("disables submit button for short passwords", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, { target: { value: "short" } });

      expect(submitButton).toBeDisabled();
    });
  });

  describe("Forbidden Words Detection", () => {
    it("detects forbidden word 'pillow'", async () => {
      const setErrorCode = vi.fn();
      renderComponent({ setErrorCode });

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, { target: { value: "pillowmooseDish" } });
      fireEvent.click(submitButton);

      expect(setErrorCode).toHaveBeenCalledWith("example_password_used");
    });

    it("detects forbidden word 'moose'", async () => {
      const setErrorCode = vi.fn();
      renderComponent({ setErrorCode });

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, {
        target: { value: "pillow mooseDish" },
      });
      fireEvent.click(submitButton);

      expect(setErrorCode).toHaveBeenCalledWith("example_password_used");
    });
  });

  describe("Navigation", () => {
    it("navigates to security settings on cancel", async () => {
      const mockNavigate = vi.fn();
      const { useNavigate } = await import("react-router");
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      fireEvent.click(cancelButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled();
      });
    });
  });

  describe("Error Display", () => {
    it("displays error message when provided", async () => {
      renderComponent({ errorMessage: "Password is required" });

      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "Password is required",
      );
    });

    it("does not display error when message is empty", async () => {
      renderComponent({ errorMessage: "" });

      expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
    });
  });

  describe("Advanced Scenarios", () => {
    it("handles multiple forbidden words", async () => {
      const setErrorCode = vi.fn();
      renderComponent({ setErrorCode });

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, {
        target: { value: "pILLOW Moose Dish" },
      });
      fireEvent.click(submitButton);

      expect(setErrorCode).toHaveBeenCalledWith("example_password_used");
    });

    it("handles empty password gracefully", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");
      const submitButton = screen.getByTestId("submit-button");

      fireEvent.change(passwordInput, { target: { value: "" } });

      expect(submitButton).toBeDisabled();
      expect(screen.getByText("0")).toBeInTheDocument();
    });

    it("clears errors when typing", async () => {
      const setErrorCode = vi.fn();
      renderComponent({ setErrorCode });

      const passwordInput = screen.getByTestId("password-input");

      fireEvent.change(passwordInput, { target: { value: "newpassword" } });

      expect(setErrorCode).toHaveBeenCalledWith("");
    });

    it("loads password policy on mount", async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      });
    });

    it("handles policy loading errors gracefully", async () => {
      mockAuthService.requestPasswordPolicy.mockRejectedValue(
        new Error("API Error"),
      );

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      renderComponent();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it("sets language attributes correctly", async () => {
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      const passwordInput = screen.getByTestId("password-input");

      expect(heading).toHaveAttribute("lang", "en");
      expect(passwordInput).toHaveAttribute("lang", "en");
    });

    it("maintains password content during visibility toggle", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");
      const checkbox = screen.getByTestId("checkbox-checkbox1");
      const testPassword = "MySecurePassword123!";

      fireEvent.change(passwordInput, { target: { value: testPassword } });
      expect(passwordInput.value).toBe(testPassword);

      fireEvent.click(checkbox, { target: { checked: true } });
      await waitFor(() => {
        expect(passwordInput.type).toBe("text");
      });
      expect(passwordInput.value).toBe(testPassword);
    });

    it("handles paste events", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");

      fireEvent.change(passwordInput, {
        target: { value: "pastedPassword123" },
      });

      await waitFor(() => {
        expect(screen.getByText("17")).toBeInTheDocument();
      });
    });

    it("handles rapid input changes", async () => {
      renderComponent();

      const passwordInput = screen.getByTestId("password-input");

      for (let i = 1; i <= 20; i++) {
        fireEvent.change(passwordInput, { target: { value: "a".repeat(i) } });
      }

      await waitFor(() => {
        expect(screen.getByText("20")).toBeInTheDocument();
      });
    });

    it("handles component unmounting", async () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
      expect(screen.queryByTestId("password-input")).not.toBeInTheDocument();
    });
  });
});
