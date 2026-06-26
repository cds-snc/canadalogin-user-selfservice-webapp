import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import OnlineVerificationInfo from "../Online/OnlineVerificationInfo";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
const mockDispatch = vi.fn();
const mockGetOnlineIdentityVerificationMockResponse = vi.hoisted(() => vi.fn());
let mockDevOnlyFeature = true;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en", journeyType: "update" }),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        id: "user-1",
        active: true,
        userName: "test@example.com",
        name: {
          givenName: "Existing",
          familyName: "User",
          formatted: "Existing User",
        },
      },
    },
    dispatch: mockDispatch,
  }),
}));

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockDevOnlyFeature;
    },
    PAGES: {
      idvDetailsConfirmationPage: "IdvDetailsConfirmationPage",
    },
    VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (_page, { language, journeyType } = {}) => {
    const jType = journeyType ? `/${journeyType}` : "";
    return `/${language ?? "en"}/identity-verification${jType}/details-confirmation`;
  },
}));

vi.mock("../api/identityVerificationApi", async () => {
  const actual = await vi.importActual("../api/identityVerificationApi");
  return {
    ...actual,
    identityVerificationApi: {
      getOnlineIdentityVerificationMockResponse:
        mockGetOnlineIdentityVerificationMockResponse,
    },
  };
});

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsButton: ({ children, onClick, onGcdsClick, buttonRole }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
      }
      onClick={(event) => {
        onGcdsClick?.(event);
        onClick?.(event);
      }}
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
    mockGetOnlineIdentityVerificationMockResponse.mockResolvedValue({
      success: true,
      message: "ok",
      data: {
        verification_id: "verification-123",
        verification_status: "success",
        verification_method: "online",
        claims: {
          given_name: "Jane",
          family_name: "Doe",
          name: "Jane Doe",
          email: "jane@example.com",
          birthdate: "1990-05-15",
          address: {
            formatted: "123 Main Street, Ottawa, ON K1A 0B1, Canada",
          },
        },
      },
    });
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

  it("stores verified claims and navigates when Continue button is clicked", async () => {
    render(<OnlineVerificationInfo />);

    fireEvent.click(screen.getByTestId("continue-button"));

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "UPDATE_PROFILE_SUCCESS",
        payload: expect.objectContaining({
          verifiedClaims: {
            verificationId: "verification-123",
            verificationStatus: "success",
            verificationMethod: "online",
            claims: expect.objectContaining({
              birthdate: "1990-05-15",
            }),
          },
        }),
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/update/details-confirmation",
    );
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
