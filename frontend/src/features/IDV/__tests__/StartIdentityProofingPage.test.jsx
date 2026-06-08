import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import StartIdentityProofingPage from "../StartIdentityProofingPage";

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

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    idvServiceCanadaCentrePage: "idvServiceCanadaCentrePage",
    idvOnlineVerificationInfoPage: "idvOnlineVerificationInfoPage",
    idvProvincialVerificationPage: "idvProvincialVerificationPage",
  },
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  SERVICES: [
    { id: 1, title: "Parks Canada Reservations", description: "", url: "#" },
  ],
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

const mockGetOnlineIdentityVerificationUrl = vi.fn();

vi.mock("../api/identityVerificationApi", () => ({
  identityVerificationApi: {
    getOnlineIdentityVerificationUrl: (...args) =>
      mockGetOnlineIdentityVerificationUrl(...args),
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

    expect(screen.getByText("Selfie and photo of your ID")).toBeInTheDocument();
    expect(screen.getByText("Use your provincial sign in")).toBeInTheDocument();
  });

  it("renders in-person heading and options", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByText("Canada Post locations")).toBeInTheDocument();
    expect(screen.getByText("Service Canada Centres")).toBeInTheDocument();
  });

  it("renders the sign back in notice", () => {
    render(<StartIdentityProofingPage />);

    expect(screen.getByText(/sign back in to your/)).toBeInTheDocument();
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
      name: /Selfie and photo of your ID/,
    });
    fireEvent.click(radio);

    expect(screen.getByTestId("continue-button")).not.toBeDisabled();
  });

  it("enables Continue button when an in-person method is selected", () => {
    render(<StartIdentityProofingPage />);

    const radio = screen.getByRole("radio", {
      name: /Service Canada Centres/,
    });
    fireEvent.click(radio);

    expect(screen.getByTestId("continue-button")).not.toBeDisabled();
  });

  // ── Mutual exclusion ──────────────────────────
  it("clears in-person selection when online method is selected", () => {
    render(<StartIdentityProofingPage />);

    // First select in-person
    fireEvent.click(
      screen.getByRole("radio", { name: /Service Canada Centres/ }),
    );
    // Then select online
    fireEvent.click(
      screen.getByRole("radio", { name: /Selfie and photo of your ID/ }),
    );

    // In-person radio should no longer be checked
    expect(
      screen.getByRole("radio", { name: /Service Canada Centres/ }),
    ).not.toBeChecked();
    // Online radio should be checked
    expect(
      screen.getByRole("radio", { name: /Selfie and photo of your ID/ }),
    ).toBeChecked();
  });

  it("clears online selection when in-person method is selected", () => {
    render(<StartIdentityProofingPage />);

    // First select online
    fireEvent.click(
      screen.getByRole("radio", { name: /Selfie and photo of your ID/ }),
    );
    // Then select in-person
    fireEvent.click(
      screen.getByRole("radio", { name: /Canada Post locations/ }),
    );

    // Online radio should no longer be checked
    expect(
      screen.getByRole("radio", { name: /Selfie and photo of your ID/ }),
    ).not.toBeChecked();
    // In-person radio should be checked
    expect(
      screen.getByRole("radio", { name: /Canada Post locations/ }),
    ).toBeChecked();
  });

  // ── Continue button actions ────────────────────
  it("navigates to online verification info page for document scanning option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Selfie and photo of your ID/ }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/idvOnlineVerificationInfoPage",
    );
  });

  it("navigates to provincial verification page for provincial partner option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Use your provincial sign in/ }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/idvProvincialVerificationPage",
    );
  });

  it("navigates to Service Canada page for Service Canada option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Service Canada Centres/ }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/en/idvServiceCanadaCentrePage");
  });

  it("navigates for Canada Post option", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(
      screen.getByRole("radio", { name: /Canada Post locations/ }),
    );
    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/en/idvServiceCanadaCentrePage");
  });

  // ── Cancel button ──────────────────────────────
  it("navigates to home when Cancel button is clicked", () => {
    render(<StartIdentityProofingPage />);

    fireEvent.click(screen.getByTestId("cancel-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
