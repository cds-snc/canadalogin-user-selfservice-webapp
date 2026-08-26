import { BrowserRouter } from "react-router";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ConfirmUpdate from "../components/ConfirmUpdate";
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
  GcdsButton: ({ children, onGcdsClick, disabled, buttonRole, ...props }) => (
    <button
      data-testid="gcds-button"
      onClick={onGcdsClick}
      disabled={disabled}
      data-button-role={buttonRole}
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
  GcdsIcon: ({ name, size }) => (
    <div data-testid="gcds-icon" data-icon-name={name} data-icon-size={size} />
  ),
  GcdsNotice: ({
    children,
    noticeRole,
    noticeTitle,
    noticeTitleTag,
    ...props
  }) => {
    const TitleTag = noticeTitleTag || "h2";
    return (
      <div data-testid="gcds-notice" data-notice-role={noticeRole} {...props}>
        {noticeTitle && <TitleTag>{noticeTitle}</TitleTag>}
        {children}
      </div>
    );
  },
  GcdsLink: ({ children, href, onClick, ...props }) => (
    <a data-testid="gcds-link" href={href} onClick={onClick} {...props}>
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

vi.mock("../../../components/RPInfo/RPNameDisplay", () => ({
  default: ({ rpName }) => <span data-testid="rp-name-display">{rpName}</span>,
}));

// Mock libphonenumber-js for phone formatting
vi.mock("libphonenumber-js", () => ({
  default: vi.fn(),
}));

import parsePhoneNumberFromString from "libphonenumber-js";

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("ConfirmUpdate Component", () => {
  const mockOnNext = vi.fn();
  const mockOnCancel = vi.fn();
  const mockSetErrorCode = vi.fn();

  const defaultProps = {
    onNext: mockOnNext,
    onCancel: mockOnCancel,
    setErrorCode: mockSetErrorCode,
    phoneFormData: {
      phoneNumber: "+15551234567",
      formattedPhoneNumber: "+1 (555) 123-4567",
      otpType: "sms",
    },
    errorMessage: "",
    localLoading: false,
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
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-heading")).toHaveTextContent(
      "Are you sure you want to update your phone number?",
    );
  });

  it("displays the phone number to be updated", () => {
    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    expect(
      screen.getByText(
        "You've requested to update your contact phone number to:",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });

  it("displays warning message with icon", () => {
    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
  });

  it("displays error message when provided", () => {
    const propsWithError = {
      ...defaultProps,
      errorMessage: "Update failed",
    };

    render(
      <TestWrapper>
        <ConfirmUpdate {...propsWithError} />
      </TestWrapper>,
    );

    expect(screen.getByTestId("gcds-error-message")).toHaveTextContent(
      "Update failed",
    );
  });

  it("disables buttons when localLoading is true", () => {
    const propsWithLoading = {
      ...defaultProps,
      localLoading: true,
    };

    render(
      <TestWrapper>
        <ConfirmUpdate {...propsWithLoading} />
      </TestWrapper>,
    );

    const updateButtons = screen.getAllByTestId("gcds-button");
    const updateButton = updateButtons.find((btn) =>
      btn.textContent.includes("Yes, update"),
    );
    const cancelButton = updateButtons.find((btn) =>
      btn.textContent.includes("Cancel"),
    );

    expect(updateButton).toBeDisabled();
    expect(cancelButton).toBeDisabled();
  });

  it("enables buttons when localLoading is false", () => {
    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    const updateButtons = screen.getAllByTestId("gcds-button");
    const updateButton = updateButtons.find((btn) =>
      btn.textContent.includes("Yes, update"),
    );
    const cancelButton = updateButtons.find((btn) =>
      btn.textContent.includes("Cancel"),
    );

    expect(updateButton).not.toBeDisabled();
    expect(cancelButton).not.toBeDisabled();
  });

  it("calls onNext when Yes, update button is clicked", () => {
    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    const updateButtons = screen.getAllByTestId("gcds-button");
    const updateButton = updateButtons.find((btn) =>
      btn.textContent.includes("Yes, update"),
    );
    fireEvent.click(updateButton);

    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  it("calls onCancel when cancel button is clicked", () => {
    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    const updateButtons = screen.getAllByTestId("gcds-button");
    const cancelButton = updateButtons.find((btn) =>
      btn.textContent.includes("Cancel"),
    );
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it("falls back to formattedPhoneNumber when libphonenumber fails", () => {
    parsePhoneNumberFromString.mockImplementation(() => {
      throw new Error("Parsing failed");
    });

    render(
      <TestWrapper>
        <ConfirmUpdate {...defaultProps} />
      </TestWrapper>,
    );

    expect(screen.getByText("+1 (555) 123-4567")).toBeInTheDocument();
  });
});
