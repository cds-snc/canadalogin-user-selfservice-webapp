import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProvincialVerificationPage from "../Online/ProvincialVerificationPage";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockState = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  devOnlyFeature: true,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockState.mockNavigate,
    useLocation: () => ({ search: "" }),
  };
});

vi.mock("../../../utils/constants", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockState.devOnlyFeature;
    },
  };
});

vi.mock("../../../assets/images/BC_card.png", () => ({
  default: "bc-card-stub.png",
}));

vi.mock("../../../assets/images/AB_card.png", () => ({
  default: "ab-card-stub.png",
}));

vi.mock("../../../assets/images/QC_card.png", () => ({
  default: "qc-card-stub.png",
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsButton: ({ children, onClick, buttonRole }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={onClick}
    >
      {children}
    </button>
  ),
  GcdsCard: ({ children, cardTitle, href, imgSrc, imgAlt }) => (
    <div data-testid="gcds-card">
      <a href={href}>
        <h3>{cardTitle}</h3>
      </a>
      {imgSrc && <img src={imgSrc} alt={imgAlt ?? ""} />}
      {children}
    </div>
  ),
  GcdsLink: ({ children, href, external }) => (
    <a href={href} target={external ? "_blank" : undefined}>
      {children}
    </a>
  ),
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("ProvincialVerificationPage", () => {
  beforeEach(() => {
    mockState.mockNavigate.mockClear();
    mockState.devOnlyFeature = true;
  });

  it("renders the main heading", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByRole("heading", {
        name: "Get ready for provincial verification",
      }),
    ).toBeInTheDocument();
  });

  it("renders the follow steps instruction", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByText("Follow the steps to complete the process"),
    ).toBeInTheDocument();
  });

  it("renders both steps", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByText(
        "Select the appropriate option and follow the steps to sign in and prove your identity",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Once the verification is complete, you will be automatically redirected",
      ),
    ).toBeInTheDocument();
  });

  it("renders the BC Services Card", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByRole("heading", { name: "BC Services Card" }),
    ).toBeInTheDocument();
  });

  it("renders the Alberta.ca Account card", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByRole("heading", { name: "Alberta.ca Account" }),
    ).toBeInTheDocument();
  });

  it("renders the Québec Government Authentication Service card", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByRole("heading", {
        name: "Québec Government Authentication Service",
      }),
    ).toBeInTheDocument();
  });

  it("renders three provincial partner cards", () => {
    render(<ProvincialVerificationPage />);

    const cards = screen.getAllByTestId("gcds-card");
    expect(cards).toHaveLength(3);
  });

  it("renders the BC Services Card image", () => {
    const { container } = render(<ProvincialVerificationPage />);

    const images = container.querySelectorAll("img");
    const bcImage = Array.from(images).find((img) =>
      img.getAttribute("src")?.includes("bc-card-stub.png"),
    );
    expect(bcImage).toBeInTheDocument();
  });

  it("renders the Alberta card image", () => {
    const { container } = render(<ProvincialVerificationPage />);

    const images = container.querySelectorAll("img");
    const abImage = Array.from(images).find((img) =>
      img.getAttribute("src")?.includes("ab-card-stub.png"),
    );
    expect(abImage).toBeInTheDocument();
  });

  it("renders the Quebec card image", () => {
    const { container } = render(<ProvincialVerificationPage />);

    const images = container.querySelectorAll("img");
    const qcImage = Array.from(images).find((img) =>
      img.getAttribute("src")?.includes("qc-card-stub.png"),
    );
    expect(qcImage).toBeInTheDocument();
  });

  it("renders card images with descriptive alt text", () => {
    const { container } = render(<ProvincialVerificationPage />);

    const images = container.querySelectorAll("img");
    expect(images.length).toBeGreaterThan(0);

    const alts = Array.from(images).map((img) => img.getAttribute("alt"));
    expect(alts).toContain("British Columbia Logo");
    expect(alts).toContain("Alberta Logo");
    expect(alts).toContain("Québec Logo");
  });

  it("renders the Back button", () => {
    render(<ProvincialVerificationPage />);

    expect(screen.getByTestId("back-button")).toHaveTextContent(
      "Choose a different method",
    );
  });

  it("calls navigate(-1) when Back button is clicked", () => {
    render(<ProvincialVerificationPage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockState.mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("calls navigate(-1) only once per back button click", () => {
    render(<ProvincialVerificationPage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockState.mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("renders the more information notice", () => {
    render(<ProvincialVerificationPage />);

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(screen.getByText("For more information")).toBeInTheDocument();
  });

  it("renders the learn more link in the notice", () => {
    render(<ProvincialVerificationPage />);

    expect(
      screen.getByText("Learn more about provincial verfication"),
    ).toBeInTheDocument();
  });

  it("renders the learn more link as an external link", () => {
    render(<ProvincialVerificationPage />);

    const link = screen.getByText("Learn more about provincial verfication");
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockState.devOnlyFeature = false;

    const { container } = render(<ProvincialVerificationPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
