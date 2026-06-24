import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StartIdentityProofingPage from "../StartIdentityProofingPage";
import { IDV_JOURNEY_TYPE } from "../constants";

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

    if (page === "IdvOnlineVerificationInfoPage") {
      return `/${resolvedLanguage}/identity-verification/online`;
    }

    if (page === "IdvCompleteIdentityProofingPage") {
      return `/${resolvedLanguage}/identity-verification/not-ready`;
    }

    return `/${resolvedLanguage}/identity-verification/in-person/canada-post`;
  },
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
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      {noticeTitle ? <div>{noticeTitle}</div> : null}
      {children}
    </div>
  ),
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

  it("renders the page title", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByText("Start identity proofing")).toBeInTheDocument();
  });

  it("shows success notice when journeyType is required", () => {
    mockJourneyType = IDV_JOURNEY_TYPE.REQUIRED;

    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("You are signed in with CanadaLogin"),
    ).toBeInTheDocument();
  });

  it("does not show success notice when journeyType is not required", () => {
    mockJourneyType = "update";

    render(<StartIdentityProofingPage />);

    expect(
      screen.queryByText("You are signed in with CanadaLogin"),
    ).not.toBeInTheDocument();
  });

  it("renders the heading with app name", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText(/needs to confirm your identity/),
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
        "Do either a selfie and ID check or sign with a provincial account (BC, AB).",
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
        "Set up a visit to a Canada Post or Service Canada Centre with one piece of ID.",
      ),
    ).toBeInTheDocument();
  });

  it("renders the cant prove now option", () => {
    render(<StartIdentityProofingPage />);

    expect(
      screen.getByText("Can't prove your identity right now?"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "This service requires identity proofing but you can sign out and complete identity proofing when ready.",
      ),
    ).toBeInTheDocument();
  });

  it("renders Continue and Cancel buttons", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByTestId("continue-button")).toHaveTextContent("Continue");
    expect(screen.getByTestId("cancel-button")).toHaveTextContent("Cancel");
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
        name: /Can't prove your identity right now\?/,
      }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/not-ready",
    );
  });

  // ── Cancel button ──────────────────────────────
  it("navigates to home when Cancel button is clicked", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(screen.getByTestId("cancel-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
