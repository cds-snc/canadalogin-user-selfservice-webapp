/**
 * Unit tests for DeleteFIDO2PasskeyConfirm component
 *
 * Tests verify component behaviour:
 * - Renders heading and body text with the passkey nickname
 * - Renders confirm (danger) and cancel (secondary) buttons
 * - Calls onConfirm when the confirm button is clicked
 * - Calls onCancel when the cancel button is clicked
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import DeleteFIDO2PasskeyConfirm from "../DeleteFIDO2PasskeyConfirm";

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
}));

vi.mock("../../../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "Are you sure you want to delete this passkey?",
    2: "You are about to delete",
    3: "from your account.",
    9: "Delete passkey",
    10: "Cancel",
  }),
}));

vi.mock("../../../../../utils/constants", () => ({
  PAGES: {
    deleteFIDO2PasskeyConfirm: "DeleteFIDO2PasskeyConfirm",
  },

  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, buttonRole, ...props }) => (
    <button data-role={buttonRole} onClick={onGcdsClick} {...props}>
      {children}
    </button>
  ),
}));

describe("DeleteFIDO2PasskeyConfirm", () => {
  const defaultProps = {
    passkeyNickname: "My Passkey",
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading", () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    expect(
      screen.getByText("Are you sure you want to delete this passkey?"),
    ).toBeInTheDocument();
  });

  it("renders the passkey nickname in the body text", () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    expect(screen.getByText("My Passkey")).toBeInTheDocument();
  });

  it("renders confirm and cancel buttons", () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    expect(screen.getByText("Delete passkey")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("confirm button has danger role", () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    expect(screen.getByText("Delete passkey")).toHaveAttribute(
      "data-role",
      "danger",
    );
  });

  it("cancel button has secondary role", () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    expect(screen.getByText("Cancel")).toHaveAttribute(
      "data-role",
      "secondary",
    );
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    await userEvent.click(screen.getByText("Delete passkey"));
    expect(defaultProps.onConfirm).toHaveBeenCalledOnce();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    render(<DeleteFIDO2PasskeyConfirm {...defaultProps} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it("renders with an undefined passkeyNickname without crashing", () => {
    render(
      <DeleteFIDO2PasskeyConfirm
        passkeyNickname={undefined}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(
      screen.getByText("Are you sure you want to delete this passkey?"),
    ).toBeInTheDocument();
  });
});
