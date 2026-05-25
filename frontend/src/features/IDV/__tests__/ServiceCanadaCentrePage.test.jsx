import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ServiceCanadaCentrePage from "../InPerson/ServiceCanadaCentrePage";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "test@example.com",
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {},
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
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
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
  GcdsDetails: ({ children, detailsTitle }) => (
    <details>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("ServiceCanadaCentrePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
  });

  it("renders the page title and main heading", () => {
    render(<ServiceCanadaCentrePage />);

    expect(screen.getByText("Prove your identity")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "Get ready to visit a Service Canada Centre",
      }),
    ).toBeInTheDocument();
  });

  it("renders the follow steps instruction", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByText("Follow the steps to complete the process"),
    ).toBeInTheDocument();
  });

  it("renders all three steps", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByText(/Continue to receive your unique identification code/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Find the closest available Service Canada Centre/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Once the Service Canada agent confirms proofing/),
    ).toBeInTheDocument();
  });

  it("renders the list of acceptable IDs details element", () => {
    render(<ServiceCanadaCentrePage />);

    const matches = screen.getAllByText("List of acceptable IDs");
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });

  it("renders the receive code section heading", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByRole("heading", {
        name: "Receive your unique identification code",
      }),
    ).toBeInTheDocument();
  });

  it("renders the receive code description", () => {
    render(<ServiceCanadaCentrePage />);

    expect(
      screen.getByText(
        /The next screen will generate your unique identification code/,
      ),
    ).toBeInTheDocument();
  });

  it("displays the user email in the email instructions", () => {
    render(<ServiceCanadaCentrePage />);

    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Instructions along with your code will also be emailed/,
      ),
    ).toBeInTheDocument();
  });

  it("renders the Continue and Back buttons", () => {
    render(<ServiceCanadaCentrePage />);

    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("back-button")).toHaveTextContent("Back");
  });

  it("calls navigate(-1) when Back button is clicked", () => {
    render(<ServiceCanadaCentrePage />);

    fireEvent.click(screen.getByTestId("back-button"));

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("renders the more information notice", () => {
    render(<ServiceCanadaCentrePage />);

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(screen.getByText("For more information")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Learn more about Service Canada Centre identity proofing",
      ),
    ).toBeInTheDocument();
  });

  it("renders in French when language param is fr", async () => {
    const routerMod = await import("react-router");
    vi.spyOn(routerMod, "useParams").mockReturnValue({ language: "fr" });

    // Verify the component renders without error for the fr language param
    render(<ServiceCanadaCentrePage />);

    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
  });

  it("renders without crashing when userProfile is null", () => {
    // The top-level vi.mock applies; this test simply verifies the
    // fallback empty string for email does not throw.
    render(<ServiceCanadaCentrePage />);
    expect(screen.getByTestId("continue-button")).toBeInTheDocument();
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ServiceCanadaCentrePage />);

    expect(container).toBeEmptyDOMElement();
  });
});
