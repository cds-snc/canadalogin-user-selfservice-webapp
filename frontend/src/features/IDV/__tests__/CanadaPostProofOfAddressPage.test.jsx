import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanadaPostProofOfAddressPage from "../InPerson/CanadaPostProofOfAddressPage";

const mockNavigate = vi.fn();
const mockLocation = {
  state: {
    document: { key: "PERMANENT_RESIDENT_CARD", options: [] },
    formData: { firstName: "Jane", lastName: "Doe" },
  },
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({ language: "en", journeyType: "start" }),
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag ?? "h2";
    return <Tag {...props}>{children}</Tag>;
  },
  GcdsText: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsSelect: ({
    selectId,
    label,
    hint,
    value,
    defaultValue,
    children,
    errorMessage,
    onGcdsChange,
  }) => (
    <div>
      <label htmlFor={selectId}>{label}</label>
      {hint ? <span>{hint}</span> : null}
      <select
        id={selectId}
        data-testid={selectId}
        value={value}
        onChange={(event) => onGcdsChange?.(event)}
      >
        <option value="">{defaultValue}</option>
        {children}
      </select>
      {errorMessage ? <span>{errorMessage}</span> : null}
    </div>
  ),
  GcdsButton: ({ children, buttonRole, onGcdsClick }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={(event) => onGcdsClick?.(event)}
    >
      {children}
    </button>
  ),
}));

describe("CanadaPostProofOfAddressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.state = {
      document: { key: "PERMANENT_RESIDENT_CARD", options: [] },
      formData: { firstName: "Jane", lastName: "Doe" },
    };
  });

  it("renders the proof-of-address selector and its options", () => {
    render(<CanadaPostProofOfAddressPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "You must bring a proof of address",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Since the ID you selected does not have an address on it, you will need to bring one of the documents listed below:",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Select your proof of address (required)"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("The document must reflect your current address"),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(19);
    expect(
      screen.getByRole("option", {
        name: "Old Age Security (T4A) or CPP benefits (T4AP) statement",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "I don’t have any of these" }),
    ).toBeInTheDocument();
  });

  it("requires a proof-of-address option before continuing", () => {
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(
      screen.getByText("Select an option to continue."),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("continues to ID details with the selected proof and acknowledgement", () => {
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.change(screen.getByTestId("proof-of-address-select"), {
      target: { value: "Bank or credit card statement" },
    });
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/start/in-person/canada-post/id-details",
      {
        state: {
          document: mockLocation.state.document,
          formData: mockLocation.state.formData,
          proofOfAddressAcknowledged: true,
          proofOfAddress: "Bank or credit card statement",
        },
      },
    );
  });

  it("goes back to the previous screen", () => {
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
