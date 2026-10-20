import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CanadaPostProofOfAddressPage from "../InPerson/CanadaPostProofOfAddressPage";

const mockNavigate = vi.fn();
const mockLocation = { state: null };
const mockFlags = vi.hoisted(() => ({ devOnlyFeature: true }));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => ({ language: "en", journeyType: "start" }),
  };
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
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag ?? "h2";
    return <Tag {...props}>{children}</Tag>;
  },
  GcdsText: ({ children }) => <div>{children}</div>,
  GcdsIcon: ({ name, ...props }) => <span data-icon={name} {...props} />,
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
    mockLocation.state = null;
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
    [
      "Government ID with address",
      "Financial",
      "Bills & Housing",
      "Government Benefits",
      "Other",
    ].forEach((title) => {
      expect(screen.getByText(title).tagName).toBe("STRONG");
    });
    expect(screen.getAllByRole("listitem")).toHaveLength(18);
    expect(
      within(screen.getAllByRole("list")[0]).getByText(
        "Provincial/Territorial Photo ID/Service card",
      ),
    ).toBeInTheDocument();
  });

  it("warns users to bring one of the listed proof-of-address documents", () => {
    render(<CanadaPostProofOfAddressPage />);

    const warningSection = screen.getByRole("region", {
      name: "You must bring a proof of address",
    });
    expect(warningSection).toHaveClass("canada-post-proof-warning");
    expect(warningSection).toHaveTextContent(
      "Only continue if you have one of the documents listed above. Otherwise, you will not be able to prove your identity.",
    );
    expect(
      warningSection.querySelector('[data-icon="warning-triangle"]'),
    ).toBeInTheDocument();
  });

  it("does nothing on continue and goes back with the back button", () => {
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.click(screen.getByTestId("continue-button"));
    expect(mockNavigate).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("back-button"));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("continues to ID details with the selected document and acknowledgement", () => {
    const document = { key: "PERMANENT_RESIDENT_CARD", options: [] };
    mockLocation.state = { document };
    render(<CanadaPostProofOfAddressPage />);

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/start/in-person/canada-post/id-details",
      { state: { document, proofOfAddressAcknowledged: true } },
    );
  });
});
