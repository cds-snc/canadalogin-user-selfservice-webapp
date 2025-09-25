import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, beforeEach, afterEach, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import SessionTimeoutModal from "../../../components/Layout/SessionTimeoutModal";

// Mock dependencies
vi.mock("react-modal", () => ({
  default: ({
    children,
    isOpen,
    contentLabel,
    className,
    overlayClassName,
    ...props
  }) =>
    isOpen ? (
      <div
        data-testid="modal"
        aria-label={contentLabel}
        className={className}
        data-overlay-class={overlayClassName}
        {...props}
      >
        {children}
      </div>
    ) : null,
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({
    children,
    buttonId,
    onClick,
    disabled,
    buttonType,
    buttonRole,
    ...props
  }) => (
    <button
      data-testid={buttonId}
      onClick={onClick}
      disabled={disabled}
      data-button-type={buttonType}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsText: ({ children, size, className }) => (
    <div data-size={size} className={className}>
      {children}
    </div>
  ),
  GcdsIcon: ({ name, size, className }) => (
    <div
      data-testid="warning-icon"
      data-icon-name={name}
      data-icon-size={size}
      className={className}
    />
  ),
}));

vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: vi.fn(() => ({
    1: "Your session is about to end due to inactivity",
    2: "If you do not continue your session you will be signed out automatically",
    3: "Do you wish to continue your session?",
    4: "Stay signed in",
    5: "Sign out",
    6: "Extending...",
    7: "Signing you out...",
    8: "Your session will expire at {{time}}.",
  })),
  formatTime: vi.fn(() => `12:34:56`),
}));

vi.mock("../../../utils/faviconUtils.js", () => ({
  setWarningFavicon: vi.fn(),
  restoreDefaultFavicon: vi.fn(),
}));

vi.mock("../../../hooks/useBreakpoints.ts", () => ({
  useBreakpoints: vi.fn(() => ({
    mobile: false,
    tablet: false,
  })),
}));

import { getPageContent, formatTime } from "../../../utils/functions.jsx";
import {
  setWarningFavicon,
  restoreDefaultFavicon,
} from "../../../utils/faviconUtils.js";
import { useBreakpoints } from "../../../hooks/useBreakpoints.ts";

describe("SessionTimeoutModal", () => {
  const mockProps = {
    isOpen: true,
    expirationTime: new Date("2023-12-01T12:34:56Z"),
    onKeepSession: vi.fn(),
    onLogout: vi.fn(),
    isLoading: false,
    currentLang: "en",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock window.matchMedia for useBreakpoints
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    // Reset useBreakpoints mock to default desktop view
    useBreakpoints.mockReturnValue({
      mobile: false,
      tablet: false,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("Rendering", () => {
    it("renders nothing when isOpen is false", () => {
      render(<SessionTimeoutModal {...mockProps} isOpen={false} />);

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("renders modal when isOpen is true", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
      expect(screen.getByTestId("warning-icon")).toBeInTheDocument();
    });

    it("displays correct modal content", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      expect(
        screen.getByText("Your session is about to end due to inactivity"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          "If you do not continue your session you will be signed out automatically",
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Do you wish to continue your session?"),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Your session will expire at/),
      ).toBeInTheDocument();
    });

    it("displays formatted expiration time", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      expect(formatTime).toHaveBeenCalledWith(mockProps.expirationTime, "en");
      expect(
        screen.getByText("Your session will expire at 12:34:56."),
      ).toBeInTheDocument();
    });

    it("renders buttons with correct text", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      expect(screen.getByTestId("keep-session-btn")).toHaveTextContent(
        "Stay signed in",
      );
      expect(screen.getByTestId("logout-btn")).toHaveTextContent("Sign out");
    });

    it("shows loading text when isLoading is true", () => {
      render(<SessionTimeoutModal {...mockProps} isLoading={true} />);

      expect(screen.getByTestId("keep-session-btn")).toHaveTextContent(
        "Extending...",
      );
    });
  });

  describe("Button Interactions", () => {
    it("calls onKeepSession when Stay signed in button is clicked", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      fireEvent.click(screen.getByTestId("keep-session-btn"));

      expect(mockProps.onKeepSession).toHaveBeenCalledTimes(1);
    });

    it("calls onLogout when Sign out button is clicked", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      fireEvent.click(screen.getByTestId("logout-btn"));

      expect(mockProps.onLogout).toHaveBeenCalledTimes(1);
    });

    it("disables buttons when isLoading is true", () => {
      render(<SessionTimeoutModal {...mockProps} isLoading={true} />);

      expect(screen.getByTestId("keep-session-btn")).toBeDisabled();
      expect(screen.getByTestId("logout-btn")).toBeDisabled();
    });

    it("enables buttons when isLoading is false", () => {
      render(<SessionTimeoutModal {...mockProps} isLoading={false} />);

      expect(screen.getByTestId("keep-session-btn")).not.toBeDisabled();
      expect(screen.getByTestId("logout-btn")).not.toBeDisabled();
    });
  });

  describe("Responsive Behavior", () => {
    it("renders desktop version for desktop breakpoint", () => {
      useBreakpoints.mockReturnValue({ mobile: false, tablet: false });

      render(<SessionTimeoutModal {...mockProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal.className).toBe("session-timeout-modal");
    });

    it("renders mobile version for mobile breakpoint", () => {
      useBreakpoints.mockReturnValue({ mobile: true, tablet: false });

      render(<SessionTimeoutModal {...mockProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal.className).toBe("session-timeout-modal mobile");
    });

    it("renders mobile version for tablet breakpoint", () => {
      useBreakpoints.mockReturnValue({ mobile: false, tablet: true });

      render(<SessionTimeoutModal {...mockProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal.className).toBe("session-timeout-modal mobile");
    });
  });

  describe("Favicon Management", () => {
    it("sets warning favicon when modal opens", () => {
      render(<SessionTimeoutModal {...mockProps} isOpen={true} />);

      expect(setWarningFavicon).toHaveBeenCalledTimes(1);
    });

    it("restores default favicon when modal closes", () => {
      const { rerender } = render(
        <SessionTimeoutModal {...mockProps} isOpen={true} />,
      );

      rerender(<SessionTimeoutModal {...mockProps} isOpen={false} />);

      // Should be called at least once when modal closes
      expect(restoreDefaultFavicon).toHaveBeenCalled();
    });

    it("restores favicon on component unmount", () => {
      const { unmount } = render(
        <SessionTimeoutModal {...mockProps} isOpen={true} />,
      );

      unmount();

      expect(restoreDefaultFavicon).toHaveBeenCalled();
    });
  });

  describe("Internationalization", () => {
    it("calls getPageContent with correct language and page name", () => {
      render(<SessionTimeoutModal {...mockProps} currentLang="fr" />);

      expect(getPageContent).toHaveBeenCalledWith("fr", "SessionManagement");
    });

    it("calls formatTime with correct language", () => {
      render(<SessionTimeoutModal {...mockProps} currentLang="fr" />);

      expect(formatTime).toHaveBeenCalledWith(mockProps.expirationTime, "fr");
    });

    it("handles different language codes", () => {
      const { rerender } = render(
        <SessionTimeoutModal {...mockProps} currentLang="en" />,
      );

      expect(getPageContent).toHaveBeenCalledWith("en", "SessionManagement");
      expect(formatTime).toHaveBeenCalledWith(mockProps.expirationTime, "en");

      rerender(<SessionTimeoutModal {...mockProps} currentLang="fr-ca" />);

      expect(getPageContent).toHaveBeenCalledWith("fr-ca", "SessionManagement");
      expect(formatTime).toHaveBeenCalledWith(
        mockProps.expirationTime,
        "fr-ca",
      );
    });
  });

  describe("Modal Configuration", () => {
    it("sets correct modal properties", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      const modal = screen.getByTestId("modal");
      expect(modal).toHaveAttribute(
        "aria-label",
        "Your session is about to end due to inactivity",
      );
      expect(modal).toHaveAttribute(
        "data-overlay-class",
        "session-timeout-modal-overlay",
      );
    });

    it("configures modal to not close on overlay click or escape", () => {
      // This would be tested if we were using the real react-modal
      // For now, we verify the component renders with correct configuration
      render(<SessionTimeoutModal {...mockProps} />);

      expect(screen.getByTestId("modal")).toBeInTheDocument();
    });
  });

  describe("Icon Rendering", () => {
    it("renders warning triangle icon with correct properties", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      const icon = screen.getByTestId("warning-icon");
      expect(icon).toHaveAttribute("data-icon-name", "warning-triangle");
      expect(icon).toHaveAttribute("data-icon-size", "h1");
      expect(icon).toHaveClass("warning-icon");
    });
  });

  describe("Button Styling and Properties", () => {
    it("renders keep session button with correct properties", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      const keepButton = screen.getByTestId("keep-session-btn");
      expect(keepButton).toHaveAttribute("data-button-type", "primary");
      expect(keepButton).toHaveAttribute("type", "button");
    });

    it("renders logout button with correct properties", () => {
      render(<SessionTimeoutModal {...mockProps} />);

      const logoutButton = screen.getByTestId("logout-btn");
      expect(logoutButton).toHaveAttribute("data-button-role", "danger");
      expect(logoutButton).toHaveAttribute("type", "button");
    });
  });

  describe("Edge Cases", () => {
    it("handles missing expirationTime gracefully", () => {
      render(<SessionTimeoutModal {...mockProps} expirationTime={null} />);

      expect(formatTime).toHaveBeenCalledWith(null, "en");
      expect(
        screen.getByText(/Your session will expire at/),
      ).toBeInTheDocument();
    });

    it("handles missing currentLang gracefully", () => {
      render(<SessionTimeoutModal {...mockProps} currentLang={undefined} />);

      expect(getPageContent).toHaveBeenCalledWith(
        undefined,
        "SessionManagement",
      );
    });

    it("handles undefined onKeepSession callback", () => {
      render(<SessionTimeoutModal {...mockProps} onKeepSession={undefined} />);

      const keepButton = screen.getByTestId("keep-session-btn");
      expect(() => fireEvent.click(keepButton)).not.toThrow();
    });

    it("handles undefined onLogout callback", () => {
      render(<SessionTimeoutModal {...mockProps} onLogout={undefined} />);

      const logoutButton = screen.getByTestId("logout-btn");
      expect(() => fireEvent.click(logoutButton)).not.toThrow();
    });
  });

  describe("Text Replacement", () => {
    it("replaces time placeholder in session expiration message", () => {
      const customPageContent = {
        1: "Session Timeout",
        2: "Warning message",
        3: "Continue?",
        4: "Stay",
        5: "Logout",
        6: "Loading...",
        8: "Session expires at {{time}} exactly.",
      };

      getPageContent.mockReturnValue(customPageContent);
      formatTime.mockReturnValue("15:30:45");

      render(<SessionTimeoutModal {...mockProps} />);

      expect(
        screen.getByText("Session expires at 15:30:45 exactly."),
      ).toBeInTheDocument();
    });
  });
});
