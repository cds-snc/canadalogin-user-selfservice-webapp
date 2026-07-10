import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import OnlineRadioButtons from "../components/OnlineRadioButtons";
import { ONLINE_IDV_METHOD } from "../components/methods";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
vi.mock("@gcds-core/components-react", () => ({
  GcdsRadios: ({ name, legend, options, value, onGcdsChange }) => (
    <fieldset data-testid="gcds-radios" data-name={name} data-value={value}>
      <legend>{legend}</legend>
      {options.map((opt) => (
        <label key={opt.id}>
          <input
            type="radio"
            name={name}
            id={opt.id}
            value={opt.value}
            checked={opt.checked}
            onChange={(e) => {
              const event = new Event("gcdsChange");
              Object.defineProperty(event, "target", {
                value: { value: e.target.value },
              });
              onGcdsChange(event);
            }}
            readOnly={!onGcdsChange}
          />
          {opt.label}
          {opt.hint && <span className="hint">{opt.hint}</span>}
        </label>
      ))}
    </fieldset>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("OnlineRadioButtons", () => {
  const defaultProps = {
    selectedMethod: undefined,
    onMethodChange: vi.fn(),
  };

  it("renders radio group with correct legend", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(screen.getByText("Do it online")).toBeInTheDocument();
  });

  it("renders document scanning option", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(screen.getByText("Selfie and photo of your ID")).toBeInTheDocument();
  });

  it("renders provincial partner option", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(screen.getByText("Use your provincial sign in")).toBeInTheDocument();
  });

  it("renders hint text for both options", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(
      screen.getByText(
        /You will be asked to take a photo of yourself and then your government issued photo ID with your phone camera/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /BC Service Card, Alberta\.ca account or Quebec.*prove your identity/,
      ),
    ).toBeInTheDocument();
  });

  it("marks document scanning as checked when selected", () => {
    render(
      <OnlineRadioButtons
        {...defaultProps}
        selectedMethod={
          ONLINE_IDV_METHOD?.documentScanning ?? "document-scanning"
        }
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Selfie and photo of your ID/,
    });
    expect(radio).toBeChecked();
  });

  it("marks provincial partner as checked when selected", () => {
    render(
      <OnlineRadioButtons
        {...defaultProps}
        selectedMethod={
          ONLINE_IDV_METHOD?.provincialPartner ?? "provincial-partner"
        }
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Use your provincial sign in/,
    });
    expect(radio).toBeChecked();
  });

  it("has no option checked when selectedMethod is undefined", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).not.toBeChecked();
    });
  });

  it("uses correct name attribute for the radio group", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute(
      "data-name",
      "online-idv-method",
    );
  });

  it("passes empty string as value when no method is selected", () => {
    render(<OnlineRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute("data-value", "");
  });

  it("passes selected method as value", () => {
    render(
      <OnlineRadioButtons
        {...defaultProps}
        selectedMethod={
          ONLINE_IDV_METHOD?.documentScanning ?? "documentScanning"
        }
      />,
    );

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute(
      "data-value",
      "documentScanning",
    );
  });

  it("calls onMethodChange when a radio is selected", () => {
    const onMethodChange = vi.fn();
    render(
      <OnlineRadioButtons
        selectedMethod={undefined}
        onMethodChange={onMethodChange}
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Selfie and photo of your ID/,
    });
    fireEvent.click(radio);

    expect(onMethodChange).toHaveBeenCalledWith("documentScanning");
  });
});
