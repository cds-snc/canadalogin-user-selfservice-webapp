import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanadaPostProofOfAddressPage from "../InPerson/CanadaPostProofOfAddressPage";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({ devOnlyFeature: true }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <div>{children}</div>,
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
    mockFlags.devOnlyFeature = true;
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;

    const { container } = render(<CanadaPostProofOfAddressPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the heading, intro and every document group", () => {
    render(<CanadaPostProofOfAddressPage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "You must bring a proof of address",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Since the ID you selected does not have an address/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent),
    ).toEqual([
      "Government ID with address",
      "Financial",
      "Bills & Housing",
      "Government Benefits",
      "Other",
    ]);
    expect(screen.getAllByRole("listitem")).toHaveLength(18);
    expect(
      within(screen.getAllByRole("list")[0]).getByText(
        "Provincial/Territorial Photo ID/Service card",
      ),
    ).toBeInTheDocument();
  });

  it("does nothing on continue and goes back with the back button", () => {
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.click(screen.getByTestId("continue-button"));
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("back-button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
