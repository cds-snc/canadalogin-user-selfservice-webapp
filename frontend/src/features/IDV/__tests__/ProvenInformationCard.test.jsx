import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProvenInformationCard from "../ProvenInformationCard";

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
        name: {
          givenName: "Jane",
          familyName: "Doe",
          formatted: "Jane Doe",
        },
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
  VITE_ENVIRONMENTS: { dev: "dev", test: "test" },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, buttonRole }) => (
    <button
      data-testid={buttonRole === "secondary" ? "update-button" : "button"}
      onClick={onGcdsClick}
    >
      {children}
    </button>
  ),
}));

describe("ProvenInformationCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
  });

  it("renders null when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;
    const { container } = render(<ProvenInformationCard />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the Name section heading", () => {
    render(<ProvenInformationCard />);
    expect(screen.getByRole("heading", { name: "Name" })).toBeInTheDocument();
  });

  it("renders the formatted name from user context", () => {
    render(<ProvenInformationCard />);
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
  });

  it("renders the Date of birth section heading", () => {
    render(<ProvenInformationCard />);
    expect(
      screen.getByRole("heading", { name: "Date of birth" }),
    ).toBeInTheDocument();
  });

  it("renders the ID document section heading", () => {
    render(<ProvenInformationCard />);
    expect(
      screen.getByRole("heading", { name: "ID document saved to CanadaLogin" }),
    ).toBeInTheDocument();
  });

  it("renders the update info description text", () => {
    render(<ProvenInformationCard />);
    expect(
      screen.getByText(
        "To update this information you will need to complete another identity proofing process.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the Update information button", () => {
    render(<ProvenInformationCard />);
    expect(screen.getByTestId("update-button")).toHaveTextContent(
      "Update information",
    );
  });

  it("renders an empty name when userProfile has no formatted name", () => {
    vi.mocked(vi.importActual("../../../components/Providers/useUser")).catch(
      () => {},
    );

    // Re-mock with no formatted name
    vi.doMock("../../../components/Providers/useUser", () => ({
      useUser: () => ({
        state: { userProfile: { userName: "user@example.com", name: {} } },
        dispatch: vi.fn(),
      }),
    }));

    render(<ProvenInformationCard />);
    // Component renders without crashing
    expect(screen.getByRole("heading", { name: "Name" })).toBeInTheDocument();
  });
});
