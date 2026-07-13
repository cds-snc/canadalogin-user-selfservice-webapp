import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import InPersonProofingInProgress from "../InPerson/InPersonProofingInProgress";

const mockSendInPersonVerificationCode = vi.fn();

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
    useParams: () => ({ language: "en", journeyType: "update" }),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      relyingPartyInfo: {
        linkName: "RP Name",
        localized: {
          en: { name: "RP Service Portal" },
        },
      },
    },
  }),
}));

vi.mock("../api/inPersonIdentityVerificationApi", () => ({
  inPersonIdentityVerificationApi: {
    sendInPersonVerificationCode: () => mockSendInPersonVerificationCode(),
    getLastEmailSentDate: () => Promise.resolve({ success: false }),
  },
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    idvStartIdentityProofingPage: "IdvStartIdentityProofingPage",
  },
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, { language, journeyType } = {}) => {
    const lang = language ?? "en";
    const jType = journeyType ? `/${journeyType}` : "";

    return `/${lang}/identity-verification${jType}`;
  },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsDetails: ({ children, detailsTitle }) => (
    <details>
      <summary>{detailsTitle}</summary>
      {children}
    </details>
  ),
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsNotice: ({ children, noticeTitle, noticeRole }) => (
    <div data-testid="gcds-notice" data-role={noticeRole}>
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole, buttonId }) => (
    <button
      data-testid={
        buttonId ??
        (buttonRole === "danger"
          ? "reset-method-button"
          : "resend-email-button")
      }
      onClick={(e) => onGcdsClick?.(e)}
    >
      {children}
    </button>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("InPersonProofingInProgress", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockSendInPersonVerificationCode.mockResolvedValue({ success: true });
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<InPersonProofingInProgress />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the heading with relying party name", () => {
    render(<InPersonProofingInProgress />);

    expect(
      screen.getByRole("heading", {
        name: "RP Service Portal needs you to prove your identity",
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it("renders warning notice content", () => {
    render(<InPersonProofingInProgress />);

    expect(screen.getByTestId("gcds-notice")).toHaveAttribute(
      "data-role",
      "warning",
    );
    expect(
      screen.getByText(
        "You're partway through proofing in person with Canada Post",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Look for an email sent by CanadaLogin on/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Changed your mind about in-person proofing at Canada Post? You can reset and choose a different method instead.",
      ),
    ).toBeInTheDocument();
  });

  it("navigates to start IDV route with journey type when reset button is clicked", () => {
    render(<InPersonProofingInProgress />);

    fireEvent.click(screen.getByTestId("reset-method-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/update",
    );
  });

  it("resends code and does not navigate when resend button is clicked", () => {
    render(<InPersonProofingInProgress />);

    fireEvent.click(screen.getByTestId("resend-email-button"));

    expect(mockSendInPersonVerificationCode).toHaveBeenCalledTimes(1);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("uses sentAt from API response for the notice date when resending", async () => {
    mockSendInPersonVerificationCode.mockResolvedValue({
      success: true,
      data: { sentAt: "2026-07-20T18:00:00+00:00" },
    });

    render(<InPersonProofingInProgress />);

    fireEvent.click(screen.getByTestId("resend-email-button"));

    expect(await screen.findByText(/July 20, 2026/)).toBeInTheDocument();
  });

  it("renders the completed proofing collapsible header", () => {
    render(<InPersonProofingInProgress />);

    expect(
      screen.getByText("Already completed proofing in-person?"),
    ).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining("details-confirmation"),
    );
  });
});
