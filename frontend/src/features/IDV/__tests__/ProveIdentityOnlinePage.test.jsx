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
    idvProveIdentityOnlinePage: "IdvProveIdentityOnlinePage",
    idvOnlineVerificationInfoPage: "IdvOnlineVerificationInfoPage",
    idvProvincialVerificationPage: "IdvProvincialVerificationPage",
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (page, { language } = {}) => {
    const resolvedLanguage = language || "en";

    if (page === "IdvOnlineVerificationInfoPage") {
      return `/${resolvedLanguage}/idv/online`;
    }

    if (page === "IdvProvincialVerificationPage") {
      return `/${resolvedLanguage}/idv/online/provincial`;
    }

    return `/${resolvedLanguage}/idv/online/prove`;
  },
}));

vi.mock("../components/OnlineRadioButtons", () => ({
  default: ({ selectedMethod, onMethodChange }) => (
    <div data-testid="online-radio-buttons">
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
  GcdsButton: ({ children, onClick, onGcdsClick, buttonRole, disabled }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "back-button" : "continue-button"
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
  });

  it("renders the page heading", () => {
    render(<ProveIdentityOnlinePage />);

    expect(screen.getByText("Prove your identity online")).toBeInTheDocument();
  });

  it("renders OnlineRadioButtons component", () => {
    render(<ProveIdentityOnlinePage />);

    expect(screen.getByTestId("online-radio-buttons")).toBeInTheDocument();
  });

  it("renders Continue button (disabled by default)", () => {
    render(<ProveIdentityOnlinePage />);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton).toBeInTheDocument();
    expect(continueButton).toBeDisabled();
  });

  it("renders Back button", () => {
    render(<ProveIdentityOnlinePage />);

    const backButton = screen.getByTestId("back-button");
    expect(backButton).toBeInTheDocument();
  });

  it("enables Continue button when method is selected", () => {
    render(<ProveIdentityOnlinePage />);

    const documentScanningRadio = screen.getByLabelText(
      /Selfie and photo of your ID/,
    );
    fireEvent.click(documentScanningRadio);

    const continueButton = screen.getByTestId("continue-button");
    expect(continueButton).not.toBeDisabled();
  });

  it("navigates to OnlineVerificationInfo when document scanning is selected and Continue is clicked", () => {
    render(<ProveIdentityOnlinePage />);

    const documentScanningRadio = screen.getByLabelText(
      /Selfie and photo of your ID/,
    );
    fireEvent.click(documentScanningRadio);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith("/en/idv/online");
  });

  it("navigates to ProvincialVerificationPage when provincial partner is selected and Continue is clicked", () => {
    render(<ProveIdentityOnlinePage />);

    const provincialPartnerRadio = screen.getByLabelText(
      /Use your provincial sign in/,
    );
    fireEvent.click(provincialPartnerRadio);

    const continueButton = screen.getByTestId("continue-button");
    fireEvent.click(continueButton);

    expect(mockNavigate).toHaveBeenCalledWith("/en/idv/online/provincial");
  });

  it("navigates back when Back button is clicked", () => {
    render(<ProveIdentityOnlinePage />);

    const backButton = screen.getByTestId("back-button");
    fireEvent.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it("does not render when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ProveIdentityOnlinePage />);

    expect(container.firstChild).toBeNull();
  });
});
