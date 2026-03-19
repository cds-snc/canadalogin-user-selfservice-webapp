/**
 * Unit tests for AddFIDO2PasskeyNickname component
 *
 * Tests verify component behaviour:
 * - Renders heading, description, input, and action buttons
 * - Submit button calls onSubmit with the trimmed device name
 * - Validation: empty name calls setErrorCode with error code and does not call onSubmit
 * - Validation: whitespace-only name is rejected
 * - Submit button in form (Enter key) triggers correct behaviour
 * - Both buttons are disabled when registrationLoading is true
 * - onCancel is called when the cancel button is clicked
 */
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import AddFIDO2PasskeyNickname from "../AddFIDO2PasskeyNickname";

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
}));

vi.mock("../../../../../utils/functions", () => ({
  getPageContent: () => ({
    1: "Name your passkey",
    2: "Give your passkey a recognisable name.",
    3: "Passkey name",
    4: "For example: Work laptop",
    5: "Save passkey",
    6: "Cancel",
  }),
}));

vi.mock("../../../../../utils/constants", () => ({
  PAGES: {
    addFIDO2PasskeyNickname: "AddFIDO2PasskeyNickname",
  },
  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({
    children,
    marginBottom: _mb,
    marginTop: _mt,
    ...props
  }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, marginBottom: _mb, marginTop: _mt, ...props }) => (
    <div {...props}>{children}</div>
  ),
  GcdsHeading: ({ children, marginBottom: _mb, marginTop: _mt, ...props }) => (
    <h1 {...props}>{children}</h1>
  ),
  GcdsText: ({ children, marginBottom: _mb, marginTop: _mt, ...props }) => (
    <div {...props}>{children}</div>
  ),
  GcdsErrorMessage: ({ children, messageId: _mid, ...props }) => (
    <div data-testid="error-message" {...props}>
      {children}
    </div>
  ),
  GcdsInput: ({
    label,
    value,
    onGcdsInput,
    errorMessage,
    hint,
    inputId: _iid,
    validateOn: _va,
    ...props
  }) => (
    <div>
      <label htmlFor="passkey-name">{label}</label>
      {hint && <span data-testid="input-hint">{hint}</span>}
      {errorMessage && <span data-testid="input-error">{errorMessage}</span>}
      <input
        id="passkey-name"
        data-testid="passkey-name-input"
        value={value}
        onChange={(e) => {
          onGcdsInput({ target: { value: e.target.value } });
        }}
        {...props}
      />
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
}));

describe("AddFIDO2PasskeyNickname", () => {
  const defaultProps = {
    setErrorCode: vi.fn(),
    errorMessage: "",
    onCancel: vi.fn(),
    onSubmit: vi.fn(),
    registrationLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the page heading", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(screen.getByText("Name your passkey")).toBeInTheDocument();
  });

  it("renders the description text", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(
      screen.getByText("Give your passkey a recognisable name."),
    ).toBeInTheDocument();
  });

  it("renders the passkey name input with correct label", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(screen.getByLabelText("Passkey name")).toBeInTheDocument();
  });

  it("renders input hint text", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(screen.getByTestId("input-hint")).toHaveTextContent(
      "For example: Work laptop",
    );
  });

  it("renders save and cancel buttons", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(screen.getByText("Save passkey")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("cancel button has secondary role", () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    expect(screen.getByText("Cancel")).toHaveAttribute(
      "data-role",
      "secondary",
    );
  });

  it("calls onCancel when the cancel button is clicked", async () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    await userEvent.click(screen.getByText("Cancel"));
    expect(defaultProps.onCancel).toHaveBeenCalledOnce();
  });

  it("calls setErrorCode with error_passkey_name_required when name is empty", async () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    await userEvent.click(screen.getByText("Save passkey"));
    expect(defaultProps.setErrorCode).toHaveBeenCalledWith(
      "error_passkey_name_required",
    );
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls setErrorCode when name is only whitespace", async () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    const input = screen.getByTestId("passkey-name-input");
    await userEvent.type(input, "   ");
    await userEvent.click(screen.getByText("Save passkey"));
    expect(defaultProps.setErrorCode).toHaveBeenCalledWith(
      "error_passkey_name_required",
    );
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("calls onSubmit with the device name when a valid name is entered", async () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    const input = screen.getByTestId("passkey-name-input");
    await userEvent.type(input, "Work Laptop");
    await userEvent.click(screen.getByText("Save passkey"));
    expect(defaultProps.onSubmit).toHaveBeenCalledWith("Work Laptop");
    expect(defaultProps.setErrorCode).not.toHaveBeenCalled();
  });

  it("disables both buttons when registrationLoading is true", () => {
    render(
      <AddFIDO2PasskeyNickname {...defaultProps} registrationLoading={true} />,
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toBeDisabled();
    });
  });

  it("does not disable buttons when registrationLoading is false", () => {
    render(
      <AddFIDO2PasskeyNickname {...defaultProps} registrationLoading={false} />,
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).not.toBeDisabled();
    });
  });

  it("submitting the form via Enter key triggers validation and onSubmit", async () => {
    render(<AddFIDO2PasskeyNickname {...defaultProps} />);
    const input = screen.getByTestId("passkey-name-input");
    await userEvent.type(input, "My Phone");
    fireEvent.submit(input.closest("form"));
    // Let async handlers resolve
    await vi.waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith("My Phone");
    });
  });

  it("passes errorMessage to the input as an error indicator", () => {
    render(
      <AddFIDO2PasskeyNickname
        {...defaultProps}
        errorMessage="Name is required"
      />,
    );
    expect(screen.getByTestId("input-error")).toHaveTextContent(
      "Name is required",
    );
  });
});
