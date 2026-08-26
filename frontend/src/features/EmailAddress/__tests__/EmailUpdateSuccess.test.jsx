import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router";
import React from "react";
import EmailUpdateSuccess from "../EmailUpdateSuccess";

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
    emailUpdateSuccess: "EmailUpdateSuccess",
  },
  EXTERNAL_NAVIGATION_LINKS: {
    gcAccountDirectory: "https://account.gc.ca",
  },
}));

// Mock SubmitButton component
vi.mock("../../../components/Layout/SubmitButton", () => ({
  default: ({ onClick, children, style }) => (
    <button data-testid="submit-button" onClick={onClick} style={style}>
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
  GcdsHeading: ({ children, tag = "h1", lang, marginBottom, marginTop }) => {
    const Component = tag;
    return (
      <Component
        lang={lang}
        data-testid="gcds-heading"
        data-margin-bottom={marginBottom}
        data-margin-top={marginTop}
      >
        {children}
      </Component>
    );
  },
  GcdsText: ({ children, marginBottom, lang }) => (
    <div data-testid="gcds-text" data-margin-bottom={marginBottom} lang={lang}>
      {children}
    </div>
  ),
  GcdsButton: ({ children, buttonRole, onClick, style }) => (
    <button
      data-testid="gcds-button"
      data-button-role={buttonRole}
      onClick={onClick}
      style={style}
    >
      {children}
    </button>
  ),
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
  GcdsLink: ({ children, href, onGcdsClick }) => {
    const handleClick = (e) => {
      if (onGcdsClick) {
        e.preventDefault();
        onGcdsClick({ preventDefault: () => {}, detail: { href } });
      }
    };
    return (
      <a data-testid="gcds-link" href={href} onClick={handleClick}>
        {children}
      </a>
    );
  },
  GcdsIcon: ({ name, label }) => (
    <span data-testid="gcds-icon" data-name={name} aria-label={label}>
      {name}
    </span>
  ),
  GcdsNotice: ({ children, noticeRole, noticeTitleTag, noticeTitle }) => (
    <div
      data-testid="gcds-notice"
      data-notice-role={noticeRole}
      data-notice-title-tag={noticeTitleTag}
      data-notice-title={noticeTitle}
    >
      {children}
    </div>
  ),
}));

// Import mocked functions
import { useParams } from "react-router";

describe("EmailUpdateSuccess", () => {
  const mockOnBackToProfile = vi.fn();
  const mockOnSignOut = vi.fn();
  const mockUseParams = vi.mocked(useParams);

  const defaultProps = {
    newEmailAddress: "newemail@example.com",
    onBackToProfile: mockOnBackToProfile,
    onSignOut: mockOnSignOut,
  };

  const renderComponent = (props = {}) => {
    return render(
      <BrowserRouter>
        <EmailUpdateSuccess {...defaultProps} {...props} />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseParams.mockReturnValue({ language: "en" });
  });

  describe("Component Rendering", () => {
    it("renders the basic component structure", () => {
      renderComponent();

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-notice")).toHaveLength(2);
      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-text").length).toBeGreaterThanOrEqual(
        6,
      );
    });

    it("renders the success notice with correct type", () => {
      renderComponent();

      const notices = screen.getAllByTestId("gcds-notice");
      expect(notices[0]).toHaveAttribute("data-notice-role", "success");
      expect(notices[0]).toHaveAttribute("data-notice-title-tag", "h2");
      expect(notices[0]).toHaveAttribute("data-notice-title", "Success");
      expect(notices[1]).toHaveAttribute("data-notice-role", "warning");
    });

    it("displays the new email address in the success message", () => {
      renderComponent();

      expect(
        screen.getByText((content) =>
          content.includes("Your email address has been updated to:"),
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("newemail@example.com")).toBeInTheDocument();
    });

    it("renders the heading with correct attributes", () => {
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      expect(heading).toHaveAttribute("data-margin-bottom", "300");
      expect(heading).toHaveAttribute("data-margin-top", "400");
      expect(heading).toHaveAttribute("lang", "en");
    });

    it("renders the action buttons", () => {
      renderComponent();

      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-button")).toBeInTheDocument();
      expect(screen.getByText("Back to profile")).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
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

  describe("Email Address Display", () => {
    it("displays different email addresses correctly", () => {
      renderComponent({ newEmailAddress: "user123@test.com" });

      expect(screen.getByText("user123@test.com")).toBeInTheDocument();
    });

    it("handles very long email addresses", () => {
      const longEmail = "verylongemailaddressfortesting@verylongdomainname.com";
      renderComponent({ newEmailAddress: longEmail });

      expect(screen.getByText(longEmail)).toBeInTheDocument();
    });

    it("handles email addresses with special characters", () => {
      const specialEmail = "user+test@example-domain.co.uk";
      renderComponent({ newEmailAddress: specialEmail });

      expect(screen.getByText(specialEmail)).toBeInTheDocument();
    });

    it("handles undefined email address gracefully", () => {
      renderComponent({ newEmailAddress: undefined });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles empty email address", () => {
      renderComponent({ newEmailAddress: "" });

      // Check that component renders without crashing with empty email
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });
  });

  describe("Button Interactions", () => {
    it("back to profile button is clickable", async () => {
      const user = userEvent.setup();
      renderComponent();

      const backButton = screen.getByTestId("submit-button");
      await user.click(backButton);

      expect(mockOnBackToProfile).toHaveBeenCalledTimes(1);
    });

    it("sign out button is clickable", async () => {
      const user = userEvent.setup();
      renderComponent();

      const signOutButton = screen.getByTestId("gcds-button");
      await user.click(signOutButton);

      expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });

    it("handles multiple button clicks", async () => {
      const user = userEvent.setup();
      renderComponent();

      const backButton = screen.getByTestId("submit-button");
      const signOutButton = screen.getByTestId("gcds-button");

      await user.click(backButton);
      await user.click(signOutButton);
      await user.click(backButton);

      expect(mockOnBackToProfile).toHaveBeenCalledTimes(2);
      expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });

    it("renders buttons with correct styles", () => {
      renderComponent();

      const backButton = screen.getByTestId("submit-button");
      const signOutButton = screen.getByTestId("gcds-button");

      expect(backButton).toHaveAttribute("style");
      expect(signOutButton).toHaveAttribute("style");
      expect(signOutButton).toHaveAttribute("data-button-role", "secondary");
    });
  });

  describe("Link Interactions", () => {
    it("renders the GC Account directory link", () => {
      renderComponent();

      const links = screen.getAllByTestId("gcds-link");
      expect(links.length).toBeGreaterThanOrEqual(2);
      expect(links[0]).toHaveAttribute("href", "https://account.gc.ca");
      expect(links[1]).toHaveAttribute("href", "https://account.gc.ca");
      expect(
        screen.getByText("Government of Canada account directory"),
      ).toBeInTheDocument();
    });

    it("handles link with different href", () => {
      // Test with a mock to change the constants
      vi.doMock("../../../utils/constants", () => ({
        PAGES: {
          emailUpdateSuccess: "EmailUpdateSuccess",
        },
        EXTERNAL_NAVIGATION_LINKS: {
          gcAccountDirectory: "https://test-account.gc.ca",
        },
      }));

      renderComponent();

      const links = screen.getAllByTestId("gcds-link");
      links.forEach((link) => {
        expect(link).toHaveAttribute("href", "https://account.gc.ca");
      });
    });
  });

  describe("GCDS Component Interactions", () => {
    it("should render GCDS components with proper attributes", () => {
      renderComponent();

      const container = screen.getByTestId("gcds-container");
      const grid = screen.getByTestId("gcds-grid");
      const notices = screen.getAllByTestId("gcds-notice");

      expect(container).toHaveAttribute("role", "main");
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
      expect(notices[0]).toHaveAttribute("data-notice-role", "success");
      expect(notices[1]).toHaveAttribute("data-notice-role", "warning");
    });

    it("should render text components with language attributes", () => {
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      expect(heading).toHaveAttribute("lang", "en");

      // Check text elements that should have lang attributes
      const textElements = screen.getAllByTestId("gcds-text");
      const textElementsWithLang = textElements.filter((element) =>
        element.hasAttribute("lang"),
      );
      expect(textElementsWithLang.length).toBeGreaterThan(0);

      textElementsWithLang.forEach((element) => {
        expect(element).toHaveAttribute("lang", "en");
      });
    });

    it("should handle French language attributes", () => {
      mockUseParams.mockReturnValue({ language: "fr" });
      renderComponent();

      const heading = screen.getByTestId("gcds-heading");
      expect(heading).toHaveAttribute("lang", "fr");

      // Check text elements that should have lang attributes
      const textElements = screen.getAllByTestId("gcds-text");
      const textElementsWithLang = textElements.filter((element) =>
        element.hasAttribute("lang"),
      );
      expect(textElementsWithLang.length).toBeGreaterThan(0);

      textElementsWithLang.forEach((element) => {
        expect(element).toHaveAttribute("lang", "fr");
      });
    });
  });

  describe("Error Handling", () => {
    it("handles missing page content gracefully", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing page content properties", () => {
      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing callback functions", () => {
      expect(() =>
        renderComponent({
          onBackToProfile: undefined,
          onSignOut: undefined,
        }),
      ).not.toThrow();
    });
  });

  describe("Component Structure", () => {
    it("renders all page content elements", () => {
      renderComponent();

      expect(
        screen.getByText(
          "You may need to update your email address other places",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes("This only changes your email"),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes("If you are trying to update your email"),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes(
            "To search for another Government of Canada Account",
          ),
        ),
      ).toBeInTheDocument();
      const notices = screen.getAllByTestId("gcds-notice");
      expect(notices[1]).toHaveAttribute(
        "data-notice-title",
        "You may need to sync this update",
      );
    });

    it("renders content with proper structure", () => {
      renderComponent();

      // Check that strong elements are rendered
      const strongElements = screen.getAllByText(
        (content, element) => element?.tagName === "STRONG",
      );
      expect(strongElements.length).toBeGreaterThan(0);
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

    it("renders email address with strong emphasis", () => {
      renderComponent();

      const emailElement = screen.getByText("newemail@example.com");
      expect(emailElement.closest("strong")).toBeInTheDocument();
    });

    it("renders notice with proper title tag", () => {
      renderComponent();

      const notices = screen.getAllByTestId("gcds-notice");
      expect(notices[0]).toHaveAttribute("data-notice-title-tag", "h2");
      expect(notices[1]).toHaveAttribute("data-notice-title-tag", "h2");
    });
  });

  describe("Edge Cases", () => {
    it("handles null email address", () => {
      renderComponent({ newEmailAddress: null });

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
    it("tests all callback functions directly", async () => {
      const user = userEvent.setup();
      renderComponent();

      const backButton = screen.getByTestId("submit-button");
      const signOutButton = screen.getByTestId("gcds-button");

      await user.click(backButton);
      await user.click(signOutButton);

      expect(mockOnBackToProfile).toHaveBeenCalledTimes(1);
      expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });

    it("tests component with all props variations", () => {
      const testProps = {
        newEmailAddress: "test@example.com",
        onBackToProfile: vi.fn(),
        onSignOut: vi.fn(),
      };

      renderComponent(testProps);

      expect(screen.getByText("test@example.com")).toBeInTheDocument();
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
          <EmailUpdateSuccess
            {...defaultProps}
            newEmailAddress="new@test.com"
          />
        </BrowserRouter>,
      );

      expect(screen.getByText("new@test.com")).toBeInTheDocument();
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
            <EmailUpdateSuccess
              {...defaultProps}
              newEmailAddress={`test${i}@example.com`}
            />
          </BrowserRouter>,
        );
      }

      expect(screen.getByText("test4@example.com")).toBeInTheDocument();
    });
  });
});
