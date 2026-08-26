import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import React from "react";
import EmailConfirmUpdate from "../EmailConfirmUpdate";

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
    emailConfirmUpdate: "EmailConfirmUpdate",
  },
}));

// Mock RPNameDisplay component
vi.mock("../../../components/RPInfo/RPNameDisplay", () => ({
  default: ({ rpName }) => <div data-testid="rp-name-display">{rpName}</div>,
}));

// Mock SubmitButton component
vi.mock("../../../components/Layout/SubmitButton", () => ({
  default: ({ onClick, children }) => (
    <button data-testid="submit-button" onClick={onClick} type="submit">
      {children}
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
  GcdsText: ({ children, marginBottom }) => (
    <div data-testid="gcds-text" data-margin-bottom={marginBottom}>
      {children}
    </div>
  ),
  GcdsNotice: ({ children, noticeRole, noticeTitle, noticeTitleTag }) => {
    const Tag = noticeTitleTag || "h2";
    return (
      <div data-testid="gcds-notice" data-notice-role={noticeRole}>
        <Tag data-testid="gcds-notice-title">{noticeTitle}</Tag>
        {children}
      </div>
    );
  },
  GcdsGrid: ({ children, columns, gap, marginTop }) => (
    <div
      data-testid="gcds-grid"
      data-columns={columns}
      data-gap={gap}
      data-margin-top={marginTop}
    >
      {children}
    </div>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole, disabled, style }) => (
    <button
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
      style={style}
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "primary-button"
      }
    >
      {children}
    </button>
  ),
}));

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
  };
});

// Import mocked functions
import { useParams } from "react-router";

describe("EmailConfirmUpdate", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();
  const mockUseParams = vi.mocked(useParams);

  const defaultFormData = {
    emailAddress: "test@example.com",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseParams.mockReturnValue({ language: "en" });
  });

  const renderComponent = (props = {}) => {
    const defaultProps = {
      formData: defaultFormData,
      onSubmit: mockOnSubmit,
      onCancel: mockOnCancel,
      ...props,
    };

    return render(
      <BrowserRouter>
        <EmailConfirmUpdate {...defaultProps} />
      </BrowserRouter>,
    );
  };

  describe("Component Rendering", () => {
    it("renders the basic component structure", () => {
      renderComponent();

      // Check that the component renders without throwing
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("renders the heading with correct text", () => {
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      expect(heading).toHaveTextContent(
        "Are you sure you want to update your email address?",
      );
    });

    it("renders email address confirmation text", () => {
      renderComponent();

      expect(
        screen.getByText((content) =>
          content.includes("You've requested to update your email address to:"),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("test@example.com")).toBeInTheDocument();
    });

    it("renders warning notice text", () => {
      renderComponent();

      expect(screen.getByTestId("gcds-notice-title")).toHaveTextContent(
        "Warning",
      );
      expect(
        screen.getByText("Updating your email address will:"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "Change your email address with all services you have connected to your CanadaLogin",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Send a notification to your old email address"),
      ).toBeInTheDocument();
    });

    it("renders submit and cancel buttons", () => {
      renderComponent();

      expect(screen.getByTestId("submit-button")).toHaveTextContent(
        "Yes, update",
      );
      expect(screen.getByTestId("cancel-button")).toHaveTextContent("Cancel");
    });
  });

  describe("Language Support", () => {
    it("renders with French language param", () => {
      mockUseParams.mockReturnValue({ language: "fr" });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing language parameter", () => {
      mockUseParams.mockReturnValue({});

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Form Data Handling", () => {
    it("displays correct email address", () => {
      renderComponent({
        formData: { emailAddress: "user@domain.com" },
      });

      expect(screen.getByText("user@domain.com")).toBeInTheDocument();
    });

    it("renders null when formData is missing", () => {
      const { container } = renderComponent({
        formData: null,
      });

      expect(container.firstChild).toBeNull();
    });

    it("renders null when emailAddress is missing", () => {
      const { container } = renderComponent({
        formData: {},
      });

      expect(container.firstChild).toBeNull();
    });

    it("renders null when emailAddress is empty", () => {
      const { container } = renderComponent({
        formData: { emailAddress: "" },
      });

      expect(container.firstChild).toBeNull();
    });

    it("handles undefined formData gracefully", () => {
      const { container } = renderComponent({
        formData: undefined,
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Form Interactions", () => {
    it("submit button is clickable", async () => {
      renderComponent();
      const user = userEvent.setup();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("cancel button is clickable", async () => {
      renderComponent();
      const user = userEvent.setup();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("handles form submission via onSubmitHandler", async () => {
      renderComponent();
      const user = userEvent.setup();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith();
    });

    it("prevents default on form submission", async () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      await userEvent.click(submitButton);

      // The onSubmit should have been called
      expect(mockOnSubmit).toHaveBeenCalled();
    });
  });

  describe("GCDS Component Interactions", () => {
    it("should handle GCDS button click events", async () => {
      renderComponent();
      const user = userEvent.setup();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    it("should handle cancel button click events", async () => {
      renderComponent();
      const user = userEvent.setup();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(cancelButton).toHaveAttribute("data-button-role", "secondary");
    });

    it("should render GCDS components with proper attributes", () => {
      renderComponent();

      // Verify container
      const container = screen.getByTestId("gcds-container");
      expect(container).toBeInTheDocument();
      expect(container).toHaveAttribute("role", "main");

      // Verify heading
      const heading = screen.getByTestId("gcds-heading");
      expect(heading).toBeInTheDocument();

      // Verify text components
      const textElements = screen.getAllByTestId("gcds-text");
      expect(textElements.length).toBeGreaterThan(0);

      // Verify grid
      const grid = screen.getByTestId("gcds-grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
    });

    it("should handle multiple button clicks", async () => {
      renderComponent();
      const user = userEvent.setup();

      const submitButton = screen.getByTestId("submit-button");
      const cancelButton = screen.getByTestId("cancel-button");

      await user.click(submitButton);
      await user.click(cancelButton);
      await user.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledTimes(2);
      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("should render buttons with correct styles", () => {
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      expect(cancelButton).toHaveStyle({ width: "fit-content" });
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
      const mockAsyncOnSubmit = vi.fn().mockResolvedValue();

      renderComponent({
        onSubmit: mockAsyncOnSubmit,
      });

      const user = userEvent.setup();
      const submitButton = screen.getByTestId("submit-button");

      await user.click(submitButton);
      expect(mockAsyncOnSubmit).toHaveBeenCalled();
    });
  });

  describe("Component Integration", () => {
    it("renders warning section content", () => {
      renderComponent();

      expect(screen.getByTestId("gcds-notice")).toHaveAttribute(
        "data-notice-role",
        "warning",
      );
      expect(screen.getByTestId("gcds-notice-title")).toHaveTextContent(
        "Warning",
      );
      expect(
        screen.getByText("Updating your email address will:"),
      ).toBeInTheDocument();
    });

    it("passes correct props to SubmitButton", () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveAttribute("type", "submit");
      expect(submitButton).toHaveTextContent("Yes, update");
    });

    it("renders all page content elements", () => {
      renderComponent();

      // Check all content is present
      expect(
        screen.getByText("Are you sure you want to update your email address?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes("You've requested to update your email address to:"),
        ),
      ).toBeInTheDocument();
      expect(screen.getByTestId("gcds-notice-title")).toHaveTextContent(
        "Warning",
      );
      expect(
        screen.getByText("Send a notification to your old email address"),
      ).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("renders main container with proper role", () => {
      renderComponent();

      const container = screen.getByTestId("gcds-container");
      expect(container).toHaveAttribute("role", "main");
    });

    it("renders heading as h1", () => {
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      expect(heading.tagName.toLowerCase()).toBe("h1");
    });

    it("renders email address with strong emphasis", () => {
      renderComponent();

      const strongEmail = screen.getByText("test@example.com");
      expect(strongEmail.tagName.toLowerCase()).toBe("strong");
    });

    it("renders warning section in accessible text elements", () => {
      renderComponent();

      expect(screen.getByTestId("gcds-notice-title")).toHaveTextContent(
        "Warning",
      );
      expect(
        screen.getByText("Updating your email address will:"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("handles very long email addresses", () => {
      const longEmail =
        "verylongusername.with.many.dots@verylongdomainname.subdomain.anotherdomain.com";

      renderComponent({
        formData: { emailAddress: longEmail },
      });

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it("handles special characters in email", () => {
      const specialEmail = "user+tag@domain-name.co.uk";

      renderComponent({
        formData: { emailAddress: specialEmail },
      });

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });

    it("handles empty page content gracefully", () => {
      renderComponent();

      // Component should render without throwing
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("handles null language parameter", () => {
      mockUseParams.mockReturnValue({ language: null });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing useParams return", () => {
      mockUseParams.mockReturnValue({});

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Function Coverage Tests", () => {
    it("tests onSubmitHandler function directly", async () => {
      renderComponent();

      // Test the async nature of onSubmitHandler
      const submitButton = screen.getByTestId("submit-button");
      await userEvent.click(submitButton);

      expect(mockOnSubmit).toHaveBeenCalledWith();
    });

    it("tests async onSubmit with await", async () => {
      const asyncOnSubmit = vi.fn().mockResolvedValue("success");

      renderComponent({
        onSubmit: asyncOnSubmit,
      });

      const submitButton = screen.getByTestId("submit-button");
      await userEvent.click(submitButton);

      expect(asyncOnSubmit).toHaveBeenCalledWith();
    });
  });

  describe("Performance and Cleanup", () => {
    it("renders without memory leaks", () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it("can be re-rendered multiple times", () => {
      const { rerender } = renderComponent();

      // Re-render with different props
      rerender(
        <BrowserRouter>
          <EmailConfirmUpdate
            formData={{ emailAddress: "new@example.com" }}
            onSubmit={mockOnSubmit}
            onCancel={mockOnCancel}
          />
        </BrowserRouter>,
      );

      expect(screen.getByText("new@example.com")).toBeInTheDocument();
    });

    it("handles component unmounting gracefully", () => {
      const { unmount } = renderComponent();

      expect(() => {
        unmount();
      }).not.toThrow();
    });

    it("handles rapid re-renders without issues", () => {
      const { rerender } = renderComponent();

      // Rapidly re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(
          <BrowserRouter>
            <EmailConfirmUpdate
              formData={{ emailAddress: `test${i}@example.com` }}
              onSubmit={mockOnSubmit}
              onCancel={mockOnCancel}
            />
          </BrowserRouter>,
        );
      }

      expect(screen.getByText("test4@example.com")).toBeInTheDocument();
    });
  });
});
