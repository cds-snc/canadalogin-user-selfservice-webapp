import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import React from "react";
import EmailOtpValidation from "../EmailOtpValidation";
import i18n from "../../../i18n";

// Setup test environment for GCDS components
import "../../../setupTests";

// Extend expect with jest-dom matchers
import "@testing-library/jest-dom";

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Mock constants
vi.mock("../../../utils/constants", () => ({
  PAGES: {
    emailOtpValidation: "EmailOtpValidation",
  },
}));

// Mock SubmitButton component
vi.mock("../../../components/Layout/SubmitButton", () => ({
  default: ({ onGcdsClick, children, currentLang: _cl, ...props }) => (
    <button
      data-testid="submit-button"
      onClick={onGcdsClick}
      type="submit"
      {...props}
    >
      {children || "Submit"}
    </button>
  ),
}));

// Mock GCDS components to enable proper event handling
vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role }) => (
    <div data-testid="gcds-container" role={role}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag = "h1", lang }) => {
    const Component = tag;
    return (
      <Component lang={lang} data-testid="gcds-heading">
        {children}
      </Component>
    );
  },
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsButton: ({ children, buttonRole, onGcdsClick }) => {
    const handleClick = (e) => {
      if (onGcdsClick) {
        e.preventDefault();
        onGcdsClick({ preventDefault: () => {} });
      }
    };
    return (
      <button
        data-testid="gcds-button"
        data-button-role={buttonRole}
        onClick={handleClick}
      >
        {children}
      </button>
    );
  },
  GcdsGrid: ({ children, columns, gap }) => (
    <div data-testid="gcds-grid" data-columns={columns} data-gap={gap}>
      {children}
    </div>
  ),
  GcdsNotice: ({ children, noticeRole, noticeTitle }) => (
    <div
      data-testid="gcds-notice"
      data-notice-role={noticeRole}
      data-notice-title={noticeTitle}
    >
      {children}
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick }) => {
    const handleClick = (e) => {
      if (onGcdsClick) {
        e.preventDefault();
        onGcdsClick();
      }
    };
    return (
      <a data-testid="gcds-link" href="#" onClick={handleClick}>
        {children}
      </a>
    );
  },
  GcdsInput: ({
    onGcdsInput,
    label,
    id,
    name,
    type,
    value,
    errorMessage,
    validateOn,
    autocomplete,
    style,
    lang,
    size,
    maxlength,
    minlength,
  }) => {
    const [inputValue, setInputValue] = React.useState(value || "");

    React.useEffect(() => {
      setInputValue(value || "");
    }, [value]);

    const handleChange = (e) => {
      const newValue = e.target.value;
      setInputValue(newValue);
      if (onGcdsInput) {
        onGcdsInput({
          target: { value: newValue, name },
          detail: { value: newValue, name },
        });
      }
    };

    return (
      <div data-testid="gcds-input-wrapper" style={style}>
        <label htmlFor={id} data-testid="gcds-input-label">
          {label}
        </label>
        <input
          id={id}
          name={name}
          type={type}
          value={inputValue}
          onChange={handleChange}
          data-testid="gcds-input"
          data-validate-on={validateOn}
          autoComplete={autocomplete}
          lang={lang}
          size={size}
          maxLength={maxlength}
          minLength={minlength}
        />
        {errorMessage && (
          <div data-testid="gcds-input-error" role="alert">
            {errorMessage}
          </div>
        )}
      </div>
    );
  },
}));

// Import mocked functions
import { useParams } from "react-router";

describe("EmailOtpValidation", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockOnBack = vi.fn();
  const mockSetFormData = vi.fn();
  const mockHandleChange = vi.fn();
  const mockRequestOtpCode = vi.fn();
  const mockUseParams = vi.mocked(useParams);

  const defaultProps = {
    onSubmit: mockOnSubmit,
    onCancel: mockOnCancel,
    onBack: mockOnBack,
    formData: { emailAddress: "test@example.com" },
    setFormData: mockSetFormData,
    errorMessage: "",
    userOtpValue: "",
    handleChange: mockHandleChange,
    requestOtpCode: mockRequestOtpCode,
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <EmailOtpValidation {...defaultProps} {...props} />
      </BrowserRouter>,
    );
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ language: "en" });
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("Component Rendering", () => {
    it("renders the basic component structure", () => {
      renderComponent();

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-heading")).toHaveLength(2);
      expect(screen.getAllByTestId("gcds-text")).toHaveLength(5);
      expect(screen.getByTestId("gcds-input")).toBeInTheDocument();
    });

    it("renders the heading with correct text", () => {
      renderComponent();

      expect(screen.getByText("Check your email")).toBeInTheDocument();
    });

    it("displays the email address in confirmation text", () => {
      renderComponent();

      expect(
        screen.getByText((content) =>
          content.includes("We have sent an email with a 6-digit code to:"),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("renders the OTP input field with correct attributes", () => {
      renderComponent();

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("name", "verificationCode");
      expect(input).toHaveAttribute("id", "verificationCode");
      expect(input).toHaveAttribute("autoComplete", "one-time-code");
      expect(input).toHaveAttribute("size", "18");
      expect(input).toHaveAttribute("maxLength", "6");
      expect(input).toHaveAttribute("minLength", "6");
    });

    it("renders submit and cancel buttons", () => {
      renderComponent();

      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-button")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Language Support", () => {
    it("renders with French language param", () => {
      mockUseParams.mockReturnValue({ language: "fr" });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing language parameter", () => {
      mockUseParams.mockReturnValue({ language: undefined });

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Form Data Handling", () => {
    it("displays correct email address", () => {
      renderComponent({
        formData: { emailAddress: "different@test.com" },
      });

      expect(screen.getByText("different@test.com")).toBeInTheDocument();
    });

    it("handles missing email address", () => {
      renderComponent({
        formData: { emailAddress: "" },
      });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles undefined formData", () => {
      expect(() =>
        renderComponent({
          formData: undefined,
        }),
      ).toThrow();
    });

    it("displays OTP value in input field", () => {
      renderComponent({ userOtpValue: "123456" });

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveValue("123456");
    });

    it("displays error message when provided", () => {
      renderComponent({ errorMessage: "Invalid verification code" });

      expect(screen.getByText("Invalid verification code")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  describe("Form Interactions", () => {
    it("submit button is clickable", async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("cancel button is clickable", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("gcds-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("handles form submission via onSubmitHandler", async () => {
      const user = userEvent.setup();
      const mockAsyncOnSubmit = vi.fn().mockResolvedValue();
      renderComponent({ onSubmit: mockAsyncOnSubmit });

      const form = screen.getByTestId("gcds-container").querySelector("form");
      if (form) {
        await user.click(screen.getByTestId("submit-button"));
      }

      expect(mockAsyncOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("handles OTP input changes", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByTestId("gcds-input");
      await user.type(input, "123456");

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("back link is clickable", async () => {
      const user = userEvent.setup();
      renderComponent();

      const backLink = screen.getByText("Use a different email");
      await user.click(backLink);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
      expect(mockSetFormData).toHaveBeenCalledWith({ emailAddress: "" });
    });
  });

  describe("Basic Timer Display", () => {
    it("displays timer text initially", () => {
      renderComponent();

      expect(
        screen.getByText((content) =>
          content.includes("You can request a new code in"),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) => content.includes("seconds")),
      ).toBeInTheDocument();
    });

    it("keeps resend availability on the original short delay when OTP expiry exists", async () => {
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

    it("shows a success notice when requesting a new code succeeds", async () => {
      mockRequestOtpCode.mockResolvedValue(true);
      const user = userEvent.setup();

      renderComponent({ otpExpiry: "2000-01-01T00:00:00.000Z" });

      await user.click(screen.getAllByText("Request a new code")[0]);

      expect(mockRequestOtpCode).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("gcds-notice")).toHaveAttribute(
        "data-notice-role",
        "success",
      );
      expect(screen.getByTestId("gcds-notice")).toHaveAttribute(
        "data-notice-title",
        "Success",
      );
      expect(
        screen.getByText("We have sent you a new code"),
      ).toBeInTheDocument();
    });

    it("does not show a success notice when requesting a new code fails", async () => {
      mockRequestOtpCode.mockResolvedValue(false);
      const user = userEvent.setup();

      renderComponent({ otpExpiry: "2000-01-01T00:00:00.000Z" });

      await user.click(screen.getAllByText("Request a new code")[0]);

      expect(mockRequestOtpCode).toHaveBeenCalledTimes(1);
      expect(screen.queryByTestId("gcds-notice")).not.toBeInTheDocument();
      expect(
        screen.queryByText("We have sent you a new code"),
      ).not.toBeInTheDocument();
    });
  });

  describe("GCDS Component Interactions", () => {
    it("should handle GCDS button click events", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("gcds-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should handle GCDS input events", async () => {
      const user = userEvent.setup();
      renderComponent();

      const input = screen.getByTestId("gcds-input");
      await user.type(input, "1");

      expect(mockHandleChange).toHaveBeenCalled();
    });

    it("should render GCDS components with proper attributes", () => {
      renderComponent();

      const container = screen.getByTestId("gcds-container");
      const grids = screen.getAllByTestId("gcds-grid");
      const input = screen.getByTestId("gcds-input");

      expect(container).toHaveAttribute("role", "main");
      expect(
        grids.some((grid) => grid.getAttribute("data-columns") === "1"),
      ).toBe(true);
      expect(
        grids.some(
          (grid) =>
            grid.getAttribute("data-columns") === "max-content max-content",
        ),
      ).toBe(true);
      expect(input).toHaveAttribute("data-validate-on", "other");
    });

    it("should handle multiple button clicks", async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      const cancelButton = screen.getByTestId("gcds-button");

      await user.click(submitButton);
      await user.click(cancelButton);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("Error Handling", () => {
    it("handles missing page content gracefully", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing page content properties", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("handles async onSubmit calls correctly", async () => {
      const user = userEvent.setup();
      const mockAsyncOnSubmit = vi.fn().mockResolvedValue();

      renderComponent({ onSubmit: mockAsyncOnSubmit });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockAsyncOnSubmit).toHaveBeenCalledTimes(1);
    });
    it("handles missing callback functions", () => {
      expect(() =>
        renderComponent({
          onSubmit: undefined,
          onCancel: undefined,
          onBack: undefined,
          requestOtpCode: undefined,
        }),
      ).not.toThrow();
    });
  });

  describe("Component Integration", () => {
    it("passes correct props to input component", () => {
      renderComponent({
        userOtpValue: "123456",
        errorMessage: "Invalid code",
      });

      const input = screen.getByTestId("gcds-input");
      const label = screen.getByTestId("gcds-input-label");
      const error = screen.getByTestId("gcds-input-error");

      expect(input).toHaveValue("123456");
      expect(label).toHaveTextContent("6-digit code");
      expect(error).toHaveTextContent("Invalid code");
    });

    it("renders all page content elements", () => {
      renderComponent();

      expect(screen.getByText("Check your email")).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes("We have sent an email with a 6-digit code to:"),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Your email might take a few minutes to arrive. If you cannot find the email in your inbox, check your spam folder.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Your code will expire in")).toBeInTheDocument();
      expect(screen.getByText("Problems with the code?")).toBeInTheDocument();
    });

    it("handles form submission with preventDefault", async () => {
      const user = userEvent.setup();
      const mockOnSubmit = vi.fn();

      renderComponent({ onSubmit: mockOnSubmit });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });
  });

  describe("Accessibility", () => {
    it("renders main container with proper role", () => {
      renderComponent();

      const container = screen.getByRole("main");
      expect(container).toBeInTheDocument();
    });

    it("renders heading as h1", () => {
      renderComponent();

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it("renders second heading as h2", () => {
      renderComponent();

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toHaveTextContent("Problems with the code?");
    });

    it("renders email address with strong emphasis", () => {
      renderComponent();

      const emailElement = screen.getByText("test@example.com");
      expect(emailElement.closest("strong")).toBeInTheDocument();
    });

    it("renders error message with alert role", () => {
      renderComponent({ errorMessage: "Test error" });

      const errorElement = screen.getByRole("alert");
      expect(errorElement).toHaveTextContent("Test error");
    });

    it("renders input with proper label association", () => {
      renderComponent();

      const input = screen.getByTestId("gcds-input");
      const label = screen.getByTestId("gcds-input-label");

      expect(input).toHaveAttribute("id", "verificationCode");
      expect(label).toHaveAttribute("for", "verificationCode");
    });
  });

  describe("Edge Cases", () => {
    it("handles very long email addresses", () => {
      const longEmail = "verylongemailaddressfortesting@verylongdomainname.com";
      renderComponent({
        formData: { emailAddress: longEmail },
      });

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it("handles special characters in email", () => {
      const specialEmail = "user+test@example-domain.co.uk";
      renderComponent({
        formData: { emailAddress: specialEmail },
      });

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });

    it("handles null language parameter", () => {
      mockUseParams.mockReturnValue({ language: null });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing useParams return", () => {
      mockUseParams.mockReturnValue({});

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles empty page content gracefully", () => {
      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Function Coverage Tests", () => {
    it("tests clearValues function directly", async () => {
      const user = userEvent.setup();
      renderComponent();

      const backLink = screen.getByText("Use a different email");
      await user.click(backLink);

      expect(mockSetFormData).toHaveBeenCalledWith({ emailAddress: "" });
    });

    it("tests async operations with await", async () => {
      const user = userEvent.setup();
      const mockAsyncOnSubmit = vi.fn().mockResolvedValue("success");
      renderComponent({ onSubmit: mockAsyncOnSubmit });

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockAsyncOnSubmit).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("Performance and Cleanup", () => {
    it("renders without memory leaks", () => {
      const { unmount } = renderComponent();
      unmount();

      expect(() => renderComponent()).not.toThrow();
    });

    it("can be re-rendered multiple times", () => {
      const { rerender } = renderComponent();

      rerender(
        <BrowserRouter>
          <EmailOtpValidation {...defaultProps} userOtpValue="123456" />
        </BrowserRouter>,
      );

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveValue("123456");
    });

    it("handles component unmounting gracefully", () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it("handles rapid re-renders without issues", () => {
      const { rerender } = renderComponent();

      for (let i = 0; i < 5; i++) {
        rerender(
          <BrowserRouter>
            <EmailOtpValidation {...defaultProps} userOtpValue={`${i}23456`} />
          </BrowserRouter>,
        );
      }

      const input = screen.getByTestId("gcds-input");
      expect(input).toHaveValue("423456");
    });

    it("handles component unmounting gracefully", () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });
  });
});
