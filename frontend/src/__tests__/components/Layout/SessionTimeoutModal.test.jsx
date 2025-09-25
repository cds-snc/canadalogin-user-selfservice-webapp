import React from "react";
import { render } from "@testing-library/react";
import { vi, describe, beforeEach, it, expect } from "vitest";
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
  });

  describe("Snapshot Tests", () => {
    it("matches snapshot when modal is open", () => {
      const { container } = render(<SessionTimeoutModal {...mockProps} />);
      expect(container).toMatchSnapshot();
    });

    it("matches snapshot when modal is closed", () => {
      const { container } = render(
        <SessionTimeoutModal {...mockProps} isOpen={false} />,
      );
      expect(container).toMatchSnapshot();
    });

    it("matches snapshot in loading state", () => {
      const { container } = render(
        <SessionTimeoutModal {...mockProps} isLoading={true} />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
