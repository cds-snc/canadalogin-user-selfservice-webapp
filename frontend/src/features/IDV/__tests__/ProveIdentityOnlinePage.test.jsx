import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProveIdentityOnlinePage from "../Online/ProveIdentityOnlinePage";
import { ONLINE_IDV_METHOD } from "../components/methods";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockJourneyType = "signup";

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
  AVAILABLE_LANGUAGES: { en: "en", fr: "fr" },
  PAGES: {
    idvProveIdentityOnlinePage: "IdvProveIdentityOnlinePage",
    idvStartIdentityProofingPage: "IdvStartIdentityProofingPage",
    idvOnlineVerificationInfoPage: "IdvOnlineVerificationInfoPage",
    idvProvincialVerificationPage: "IdvProvincialVerificationPage",
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, { language, journeyType } = {}) => {
    const resolvedLanguage = language || "en";
    const resolvedJourneyType = journeyType || "signup";

    if (page === "IdvStartIdentityProofingPage") {
      return `/${resolvedLanguage}/${resolvedJourneyType}/idv/`;
    }

    if (page === "IdvOnlineVerificationInfoPage") {
      return `/${resolvedLanguage}/${resolvedJourneyType}/idv/online`;
    }

    if (page === "IdvProvincialVerificationPage") {
      return `/${resolvedLanguage}/${resolvedJourneyType}/idv/online/provincial`;
    }

    return `/${resolvedLanguage}/${resolvedJourneyType}/idv/online/prove`;
  },
}));

vi.mock("../components/OnlineRadioButtons", () => ({
  default: ({ selectedMethod, onMethodChange, errorMessage }) => (
    <div data-testid="online-radio-buttons">
      {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      <label>
        <input
          type="radio"
          name="online-method"
          value={ONLINE_IDV_METHOD.documentScanning}
          checked={selectedMethod === ONLINE_IDV_METHOD.documentScanning}
          onChange={() => onMethodChange(ONLINE_IDV_METHOD.documentScanning)}
        />
        Selfie and photo of your ID
      </label>
      <label>
        <input
          type="radio"
          name="online-method"
          value={ONLINE_IDV_METHOD.provincialPartner}
          checked={selectedMethod === ONLINE_IDV_METHOD.provincialPartner}
          onChange={() => onMethodChange(ONLINE_IDV_METHOD.provincialPartner)}
        />
        Use your provincial sign in
      </label>
    </div>
  ),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children, gap, columns }) => (
    <div data-testid="gcds-grid" data-gap={gap} data-columns={columns}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsErrorSummary: ({ id, heading, errorLinks }) => (
    <div id={id} data-testid="error-summary">
      <h2>{heading}</h2>
      {Object.entries(errorLinks ?? {}).map(([href, message], index) => (
        <a key={index} href={href}>
          {message}
        </a>
      ))}
    </div>
  ),
  GcdsButton: ({
    children,
    onClick,
    onGcdsClick,
    disabled,
    type,
    buttonRole,
  }) => (
    <button
      type={type}
      data-testid={
        type === "submit"
          ? "continue-button"
          : buttonRole === "secondary"
            ? "back-button"
            : "button"
      }
      disabled={disabled}
      onClick={(e) => (onGcdsClick ? onGcdsClick(e) : onClick?.(e))}
    >
      {children}
    </button>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("ProveIdentityOnlinePage", () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    mockDevOnlyFeature = true;
    mockJourneyType = "signup";
  });

  it("renders the page heading", () => {
    render(<ProveIdentityOnlinePage />);

    expect(screen.getByText("Prove your identity online")).toBeInTheDocument();
  });

  it("renders OnlineRadioButtons component", () => {
    render(<ProveIdentityOnlinePage />);

    expect(screen.getByTestId("online-radio-buttons")).toBeInTheDocument();
  });

  it("renders Continue button (never disabled)", () => {
    render(<ProveIdentityOnlinePage />);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).not.toBeDisabled();
  });

  it("renders Back button", () => {
    render(<ProveIdentityOnlinePage />);

    const backButton = screen.getByTestId("back-button");
    expect(backButton).toBeInTheDocument();
  });

  it("shows an error message when Continue is clicked without selecting a method", () => {
    render(<ProveIdentityOnlinePage />);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(screen.getByTestId("error-summary")).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does not show an error message when method is selected", () => {
    render(<ProveIdentityOnlinePage />);

    const documentScanningRadio = screen.getByLabelText(
      /Selfie and photo of your ID/,
    );
    fireEvent.click(documentScanningRadio);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(screen.queryByTestId("error-summary")).not.toBeInTheDocument();
  });

  it("navigates to OnlineVerificationInfo when document scanning is selected and Continue is clicked", () => {
    mockJourneyType = "manage-account";

    render(<ProveIdentityOnlinePage />);

    const documentScanningRadio = screen.getByLabelText(
      /Selfie and photo of your ID/,
    );
    fireEvent.click(documentScanningRadio);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith("/en/manage-account/idv/online");
  });

  it("navigates to ProvincialVerificationPage when provincial partner is selected and Continue is clicked", () => {
    mockJourneyType = "manage-account";

    render(<ProveIdentityOnlinePage />);

    const provincialPartnerRadio = screen.getByLabelText(
      /Use your provincial sign in/,
    );
    fireEvent.click(provincialPartnerRadio);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/manage-account/idv/online/provincial",
    );
  });

  it("navigates back to StartIdentityProofingPage when Back button is clicked", () => {
    mockJourneyType = "manage-account";

    render(<ProveIdentityOnlinePage />);

    const backButton = screen.getByTestId("back-button");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith("/en/manage-account/idv/");
  });

  it("does not render when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ProveIdentityOnlinePage />);

    expect(container.firstChild).toBeNull();
  });
});
