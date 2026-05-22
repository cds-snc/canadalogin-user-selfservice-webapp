import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import InPersonRadioButtons from "../components/InPersonRadioButtons";
import { IN_PERSON_METHOD } from "../components/methods";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
vi.mock("@gcds-core/components-react", () => ({
  GcdsRadios: ({ name, legend, options, value, hideLegend, onGcdsChange }) => (
    <fieldset
      data-testid="gcds-radios"
      data-name={name}
      data-value={value}
      data-hide-legend={hideLegend}
    >
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
        </label>
      ))}
    </fieldset>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("InPersonRadioButtons", () => {
  const CANADA_POST_METHOD =
    IN_PERSON_METHOD?.canadaPostLocations ?? "canadaPostLocations";
  const SERVICE_CANADA_METHOD =
    IN_PERSON_METHOD?.serviceCanadaLocations ?? "serviceCanadaLocations";

  const defaultProps = {
    selectedMethod: undefined,
    onMethodChange: vi.fn(),
  };

  it("renders radio group with hidden legend", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute(
      "data-hide-legend",
      "true",
    );
  });

  it("renders the legend text for accessibility", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByText("or do it in person")).toBeInTheDocument();
  });

  it("renders Canada Post locations option", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByText("Canada Post locations")).toBeInTheDocument();
  });

  it("renders Service Canada Centres option", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByText("Service Canada Centres")).toBeInTheDocument();
  });

  it("marks Canada Post as checked when selected", () => {
    render(
      <InPersonRadioButtons
        {...defaultProps}
        selectedMethod={CANADA_POST_METHOD}
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Canada Post locations/,
    });
    expect(radio).toBeChecked();
  });

  it("marks Service Canada as checked when selected", () => {
    render(
      <InPersonRadioButtons
        {...defaultProps}
        selectedMethod={SERVICE_CANADA_METHOD}
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Service Canada Centres/,
    });
    expect(radio).toBeChecked();
  });

  it("has no option checked when selectedMethod is undefined", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    const radios = screen.getAllByRole("radio");
    radios.forEach((radio) => {
      expect(radio).not.toBeChecked();
    });
  });

  it("uses correct name attribute for the radio group", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute(
      "data-name",
      "in-person-idv-method",
    );
  });

  it("passes empty string as value when no method is selected", () => {
    render(<InPersonRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute("data-value", "");
  });

  it("calls onMethodChange when a radio is selected", () => {
    const onMethodChange = vi.fn();
    render(
      <InPersonRadioButtons
        selectedMethod={undefined}
        onMethodChange={onMethodChange}
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Canada Post locations/,
    });
    fireEvent.click(radio);

    expect(onMethodChange).toHaveBeenCalledWith(CANADA_POST_METHOD);
  });
});
