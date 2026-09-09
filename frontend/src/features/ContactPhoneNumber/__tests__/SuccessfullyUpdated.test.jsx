import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import SuccessfullyUpdated from "../components/SuccessfullyUpdated";
import "@testing-library/jest-dom/vitest";

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
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
  GcdsHeading: ({
    children,
    tag,
    marginBottom: _marginBottom,
    marginTop: _marginTop,
    ...props
  }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid="gcds-heading" {...props}>
        {children}
      </Tag>
    );
  },
  GcdsText: ({ children, marginBottom: _mb, marginTop: _mt, ...props }) => (
    <div data-testid="gcds-text" {...props}>
      {children}
    </div>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole, ...props }) => (
    <button
      data-testid="gcds-button"
      onClick={onGcdsClick}
      data-button-role={buttonRole}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsNotice: ({ children, noticeTitle, noticeRole }) => (
    <div data-testid="gcds-notice" data-notice-role={noticeRole}>
      {noticeTitle && <h3>{noticeTitle}</h3>}
      {children}
    </div>
  ),
  GcdsLink: ({ children, href, ...props }) => (
    <a data-testid="gcds-link" href={href} {...props}>
      {children}
    </a>
  ),
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
  };
});

// Mock libphonenumber-js for phone formatting
vi.mock("libphonenumber-js", () => ({
  default: vi.fn(),
}));

import parsePhoneNumberFromString from "libphonenumber-js";

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("SuccessfullyUpdated Component", () => {
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();

  const defaultProps = {
    onNext: mockOnNext,
    onCancel: mockOnCancel,
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      otpType: "sms",
    },
    userProfile: {
      userName: "testuser",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    parsePhoneNumberFromString.mockImplementation((phoneNumber) => {
      if (phoneNumber === "+15551234567") {
        return {
          countryCallingCode: "1",
          formatNational: () => "(555) 123-4567",
          formatInternational: () => "+1 555 123 4567",
        };
      }
      return null;
    });
  });

  it("renders the component with correct heading", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText(
        "You may need to update your contact phone number other places",
      ),
    ).toBeInTheDocument();
  });

  it("displays success notice", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    const notices = screen.getAllByTestId("gcds-notice");
    expect(notices).toHaveLength(2);
    expect(
      notices.some((notice) => notice.dataset.noticeRole === "success"),
    ).toBe(true);
    expect(
      notices.some((notice) => notice.dataset.noticeRole === "warning"),
    ).toBe(true);
  });

  it("displays the updated phone number", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText(/Your contact phone number has been updated to:/),
    ).toBeInTheDocument();
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });

  it("displays warning notice with sync guidance", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText("You may need to sync this update"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "To sync your updated contact phone number from your CanadaLogin profile to your connected services, sign in to each service individually.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("services that can be accessed using your CanadaLogin"),
    ).toBeInTheDocument();
  });

  it("renders return to profile button", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    const button = screen.getByText("Back to profile");
    expect(button).toBeInTheDocument();
  });

  it("calls onNext when return to profile button is clicked", () => {
    const mockOnNext = vi.fn();
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} onNext={mockOnNext} />
      </TestWrapper>,
    );

    const button = screen.getByText("Back to profile");
    fireEvent.click(button);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("uses formatted phone number from phoneFormData", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    const phoneNumberElement = screen.getByText((content, node) => {
      return (
        node?.tagName?.toLowerCase() === "strong" &&
        node?.textContent?.includes("+1 (555) 123-4567")
      );
    });

    expect(phoneNumberElement).toBeInTheDocument();
  });

  it("displays formattedPhoneNumber from phoneFormData", () => {
    render(
      <TestWrapper>
        <SuccessfullyUpdated {...defaultProps} />
      </TestWrapper>,
    );

    const phoneNumberElement = screen.getByText((content, node) => {
      return (
        node?.tagName?.toLowerCase() === "strong" &&
        node?.textContent?.includes("+1 (555) 123-4567")
      );
    });

    expect(phoneNumberElement).toBeInTheDocument();
  });

  it("handles empty formattedPhoneNumber gracefully", () => {
    const propsWithoutFormatted = {
      ...defaultProps,
      phoneFormData: {
        ...defaultProps.phoneFormData,
        formattedPhoneNumber: "",
      },
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdated {...propsWithoutFormatted} />
      </TestWrapper>,
    );

    expect(
      screen.getByText(/Your contact phone number has been updated to:/),
    ).toBeInTheDocument();
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });

  it("handles undefined phoneFormData gracefully", () => {
    const propsWithUndefinedPhone = {
      ...defaultProps,
      phoneFormData: undefined,
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdated {...propsWithUndefinedPhone} />
      </TestWrapper>,
    );

    // Should still render without crashing
    expect(
      screen.getByText(
        "You may need to update your contact phone number other places",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to profile")).toBeInTheDocument();
  });

  it("handles empty phoneNumber gracefully", () => {
    const propsWithEmptyPhone = {
      ...defaultProps,
      phoneFormData: {
        phoneNumber: "",
        formattedPhoneNumber: "",
        otpType: "sms",
      },
    };

    render(
      <TestWrapper>
        <SuccessfullyUpdated {...propsWithEmptyPhone} />
      </TestWrapper>,
    );

    // Should still render without crashing
    expect(
      screen.getByText(
        "You may need to update your contact phone number other places",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Back to profile")).toBeInTheDocument();
  });
});
