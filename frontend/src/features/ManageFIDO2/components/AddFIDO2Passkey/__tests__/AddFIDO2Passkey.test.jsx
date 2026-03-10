/**
 * Unit tests for AddFIDO2Passkey component
 *
 * Tests verify component behaviour:
 * - Renders heading, instruction list items, and warning notice
 * - "Create a passkey" button calls onRegister
 * - Cancel button calls onCancel
 * - Both buttons are disabled when registrationLoading is true
 * - Error message is rendered when errorMessage is provided
 * - No error section is rendered when errorMessage is absent
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import AddFIDO2Passkey from "../AddFIDO2Passkey";

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
}));

vi.mock("../../../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "How to create a passkey",
    2: "Step 1 heading",
    3: "Step 1 description",
    4: "Step 2 heading",
    5: "Open the",
    6: "Settings",
    7: "app on your device",
    8: "Step 3 heading",
    9: "Warning:",
    10: "Warning detail",
    11: "Create a passkey",
    12: "Cancel",
  }),
}));

vi.mock("../../../../../utils/constants", () => ({
  PAGES: {
    addFIDO2Passkey: "AddFIDO2Passkey",
  },
  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("../../../../../assets/icons/passkey_collage.svg?react", () => ({
  default: (props) => <svg data-testid="passkey-collage" {...props} />,
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
  GcdsNotice: ({ children, noticeTitle, ...props }) => (
    <div data-testid="notice" {...props}>
      {noticeTitle}
      {children}
    </div>
  ),
  GcdsButton: ({ children, onClick, disabled, buttonRole, ...props }) => (
    <button
      data-role={buttonRole}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsErrorMessage: ({ children, ...props }) => (
    <div data-testid="error-message" {...props}>
      {children}
    </div>
  ),
}));

describe("AddFIDO2Passkey", () => {
  const defaultProps = {
    errorMessage: "",
    onCancel: vi.fn(),
    onRegister: vi.fn(),
    registrationLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    expect(screen.getByText("How to create a passkey")).toBeInTheDocument();
  });

  it("renders the passkey collage image", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    expect(screen.getByTestId("passkey-collage")).toBeInTheDocument();
  });

  it("renders all three step headings in the instruction list", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    expect(screen.getByText("Step 1 heading")).toBeInTheDocument();
    expect(screen.getByText("Step 2 heading")).toBeInTheDocument();
    expect(screen.getByText("Step 3 heading")).toBeInTheDocument();
  });

  it("renders the warning notice", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    expect(screen.getByTestId("notice")).toBeInTheDocument();
    expect(screen.getByText("Warning detail")).toBeInTheDocument();
  });

  it("renders the primary and cancel buttons", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    const buttons = screen.getAllByText("Create a passkey");
    // heading + button both contain this text — target the button
    expect(buttons.length).toBeGreaterThan(0);
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("cancel button has secondary role", () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    expect(screen.getByText("Cancel")).toHaveAttribute(
      "data-role",
      "secondary",
    );
  });

  it("calls onRegister when the primary button is clicked", async () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    const buttons = screen.getAllByRole("button", { name: "Create a passkey" });
    await userEvent.click(buttons[0]);
    expect(defaultProps.onRegister).toHaveBeenCalledOnce();
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    render(<AddFIDO2Passkey {...defaultProps} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it("disables both buttons when registrationLoading is true", () => {
    render(<AddFIDO2Passkey {...defaultProps} registrationLoading={true} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("does not disable buttons when registrationLoading is false", () => {
    render(<AddFIDO2Passkey {...defaultProps} registrationLoading={false} />);
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it("renders error message when errorMessage is provided", () => {
    render(
      <AddFIDO2Passkey {...defaultProps} errorMessage="Something went wrong" />,
    );
    expect(screen.getByTestId("error-message")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("does not render error message section when errorMessage is empty", () => {
    render(<AddFIDO2Passkey {...defaultProps} errorMessage="" />);
    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
  });

  it("does not render error message section when errorMessage is undefined", () => {
    render(<AddFIDO2Passkey {...defaultProps} errorMessage={undefined} />);
    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
  });
});
