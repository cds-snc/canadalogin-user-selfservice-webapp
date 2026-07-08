import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StartIdentityProofingPage from "../StartIdentityProofingPage";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockJourneyType;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en", journeyType: mockJourneyType }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    idvOnlineVerificationInfoPage: "IdvOnlineVerificationInfoPage",
    idvProveIdentityOnlinePage: "IdvProveIdentityOnlinePage",
    idvVisitCanadaPostPage: "IdvVisitCanadaPostPage",
    idvCompleteIdentityProofingPage: "IdvCompleteIdentityProofingPage",
  },
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  SERVICES: [
    { id: 1, title: "Parks Canada Reservations", description: "", url: "#" },
  ],
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, { language } = {}) => {
    const resolvedLanguage = language || "en";

    if (
      page === "IdvOnlineVerificationInfoPage" ||
      page === "IdvProveIdentityOnlinePage"
    ) {
      return `/${resolvedLanguage}/identity-verification/online`;
    }

    if (page === "IdvCompleteIdentityProofingPage") {
      return `/${resolvedLanguage}/identity-verification/not-ready`;
    }

    return `/${resolvedLanguage}/identity-verification/in-person/canada-post`;
  },
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      relyingPartyInfo: {
        linkName: "RP Name",
        localized: {
          en: { name: "RP Name" },
        },
      },
    },
  }),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, buttonRole, disabled }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "continue-button"
      }
      disabled={disabled}
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
    >
      {children}
    </button>
  ),
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsNotice: ({ children }) => <div data-testid="gcds-notice">{children}</div>,
  GcdsRadios: ({ name, legend, options, onGcdsChange, hideLegend }) => (
    <fieldset data-testid={`radios-${name}`}>
      {!hideLegend && <legend>{legend}</legend>}
      {options.map((opt) => (
        <label key={opt.id}>
          <input
            type="radio"
            name={name}
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
          {opt.hint ? <span>{opt.hint}</span> : null}
        </label>
      ))}
    </fieldset>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("StartIdentityProofingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockJourneyType = undefined;
    // Reset window.location.href
    delete window.location;
    window.location = { href: "" };
  });

  // ── Rendering ──────────────────────────────────
  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<StartIdentityProofingPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders Prove your identity title by default", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByRole("heading", {
        name: /prove your identity/i,
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it("renders Prove your identity title when journeyType is start", () => {
    mockJourneyType = "start";

    render(<StartIdentityProofingPage />);

    expect(
      screen.getByRole("heading", {
        name: "How do you want to prove your identity?",
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it("renders Prove your identity title when journeyType is update", () => {
    mockJourneyType = "update";

    render(<StartIdentityProofingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Prove your identity",
        level: 1,
      }),
    ).toBeInTheDocument();
  });

  it("renders the heading with app name", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText(/Identity proofing confirms who you are/),
    ).toBeInTheDocument();
  });

  it("renders the learn more link", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("Learn more about identity proofing"),
    ).toBeInTheDocument();
  });

  it("renders the how to prove heading", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("How do you want to prove your identity?"),
    ).toBeInTheDocument();
  });

  it("renders online radio options", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("Prove identity online and get instant access"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Do either a selfie and ID check with your phone or sign in with a provincial account (BC, AB, QC).",
      ),
    ).toBeInTheDocument();
  });

  it("renders in-person heading and options", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("Do it in person and sign back in when done"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Set up a visit to a Canada Post or Service Canada Centre with valid government-issued ID.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the cant prove now option", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("Need more time, or a different way in"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Sign out and come back when you're ready, or find out about other ways to access RP Name.",
      ),
    ).toBeInTheDocument();
  });

  it("renders Continue button", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
  });

  // ── Button disabled state ──────────────────────
  it("disables Continue button when no method is selected", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByTestId("continue-button")).toBeDisabled();
  });

  it("enables Continue button when an online method is selected", () => {
    render(<StartIdentityProofingPage />);

    const radio = screen.getByRole("radio", {
      name: /Prove identity online and get instant access/,
    });
    fireEvent.click(radio);

    expect(screen.getByTestId("continue-button")).not.toBeDisabled();
  });

  it("enables Continue button when an in-person method is selected", () => {
    render(<StartIdentityProofingPage />);

    const radio = screen.getByRole("radio", {
      name: /Do it in person and sign back in when done/,
    });
    fireEvent.click(radio);

    expect(screen.getByTestId("continue-button")).not.toBeDisabled();
  });

  // ── Continue button actions ────────────────────
  it("navigates to online verification page for online option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Prove identity online and get instant access/,
      }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/online",
    );
  });

  it("navigates to visit canada post page for in-person option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Do it in person and sign back in when done/,
      }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/in-person/canada-post",
    );
  });

  it("navigates to not-ready page for cant prove now option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", {
        name: /Need more time, or a different way in/,
      }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/not-ready",
    );
  });
});
