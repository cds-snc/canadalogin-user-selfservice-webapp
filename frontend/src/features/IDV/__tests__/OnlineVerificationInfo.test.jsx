import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnlineVerificationInfo from "../Online/OnlineVerificationInfo";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  AVAILABLE_LANGUAGES: { en: "en", fr: "fr" },
  PAGES: {},
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
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
  GcdsDetails: ({ children, detailsTitle }) => (
    <details>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
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
describe("OnlineVerificationInfo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
  });

  it("renders the main heading", () => {
    render(<OnlineVerificationInfo />);

    expect(
      screen.getByRole("heading", {
        name: "Get ready for selfie and ID check",
      }),
    ).toBeInTheDocument();
  });

  it("renders the follow steps instruction", () => {
    render(<OnlineVerificationInfo />);

    expect(
      screen.getByText("Follow the steps to complete the process"),
    ).toBeInTheDocument();
  });

  it("renders all three steps", () => {
    render(<OnlineVerificationInfo />);

    expect(
      screen.getByText("You will need one government issued photo ID"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Take a selfie and a photo of your ID in a well lit room/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Confirm your submission and get your proofing results to continue",
      ),
    ).toBeInTheDocument();
  });

  it("renders the plan for time text", () => {
    render(<OnlineVerificationInfo />);

    expect(
      screen.getByText("Plan for about 5 minutes to complete this process."),
    ).toBeInTheDocument();
  });

  it("renders the list of acceptable IDs details element", () => {
    render(<OnlineVerificationInfo />);

    const matches = screen.getAllByText("List of acceptable IDs");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the list of acceptable IDs as a summary inside a details element", () => {
    const { container } = render(<OnlineVerificationInfo />);

    const summary = container.querySelector("summary");
    expect(summary).toBeInTheDocument();
    expect(summary).toHaveTextContent("List of acceptable IDs");
  });

  it("renders the Continue and Back buttons", () => {
    render(<OnlineVerificationInfo />);

    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("back-button")).toHaveTextContent("Back");
  });

  it("calls navigate(-1) when Back button is clicked", () => {
    render(<OnlineVerificationInfo />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("calls navigate(-1) only once per back button click", () => {
    render(<OnlineVerificationInfo />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledTimes(1);
  });

  it("does not call navigate when Continue button is clicked", () => {
    render(<OnlineVerificationInfo />);

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("renders the more information notice", () => {
    render(<OnlineVerificationInfo />);

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(screen.getByText("For more information")).toBeInTheDocument();
  });

  it("renders the learn more link in the notice", () => {
    render(<OnlineVerificationInfo />);

    expect(
      screen.getByText("Learn more about how selfie and ID check works"),
    ).toBeInTheDocument();
  });

  it("renders the learn more link as an external link", () => {
    render(<OnlineVerificationInfo />);

    const link = screen.getByText(
      "Learn more about how selfie and ID check works",
    );
    expect(link.closest("a")).toHaveAttribute("target", "_blank");
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<OnlineVerificationInfo />);

    expect(container).toBeEmptyDOMElement();
  });
});
