import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import IdentityProofingRadioButtons from "../components/IdentityProofingRadioButtons";
import { START_IDENTITY_OPTION } from "../components/methods";

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
          {opt.hint && <span className="hint">{opt.hint}</span>}
        </label>
      ))}
    </fieldset>
  ),
}));

describe("IdentityProofingRadioButtons", () => {
  const defaultProps = {
    selectedOption: undefined,
    onOptionChange: vi.fn(),
  };

  it("renders radio group with hidden legend", () => {
    render(<IdentityProofingRadioButtons {...defaultProps} />);

    expect(screen.getByTestId("gcds-radios")).toHaveAttribute(
      "data-hide-legend",
      "true",
    );
  });

  it("renders all identity proofing options", () => {
    render(<IdentityProofingRadioButtons {...defaultProps} />);

    expect(
      screen.getByText("Prove identity online and get instant access"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Do it in person and sign back in when done"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Need more time, or a different way in"),
    ).toBeInTheDocument();
  });

  it("renders hint text for all options", () => {
    render(<IdentityProofingRadioButtons {...defaultProps} />);

    expect(
      screen.getByText(
        "Do either a selfie and ID check or sign with a provincial account (BC, AB).",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Set up a visit to a Canada Post or Service Canada Centre with valid government-issued ID.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign out and come back when you're ready, or find out about other ways to access RP Name.",
      ),
    ).toBeInTheDocument();
  });

  it("marks selected option as checked", () => {
    render(
      <IdentityProofingRadioButtons
        {...defaultProps}
        selectedOption={START_IDENTITY_OPTION.online}
      />,
    );

    const selectedRadio = screen.getByRole("radio", {
      name: /Prove identity online and get instant access/,
    });
    expect(selectedRadio).toBeChecked();
  });

  it("calls onOptionChange when a radio is selected", () => {
    const onOptionChange = vi.fn();
    render(
      <IdentityProofingRadioButtons
        selectedOption={undefined}
        onOptionChange={onOptionChange}
      />,
    );

    const radio = screen.getByRole("radio", {
      name: /Do it in person and sign back in when done/,
    });
    fireEvent.click(radio);

    expect(onOptionChange).toHaveBeenCalledWith(START_IDENTITY_OPTION.inPerson);
  });
});
