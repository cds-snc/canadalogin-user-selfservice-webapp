import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import ProfileHome from "../../../components/Manage/ProfileHome";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockLocationState = null;

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: mockLocationState }),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "test@example.com",
        contactNumber: "+15551234567",
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
  PAGES: {
    editEmailPage: "editEmailPage",
  },
  VITE_ENVIRONMENTS: { dev: "dev", test: "test" },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(() => "/en/update-email"),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role, ...props }) => (
    <div role={role} {...props}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag ?? "h2";
    return <Tag {...props}>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsNotice: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsLink: ({ children, href, onGcdsClick }) => (
    <a
      data-testid="gcds-link"
      href={href}
      onClick={(e) => {
        e.preventDefault();
        onGcdsClick?.({ detail: href, preventDefault: e.preventDefault });
      }}
    >
      {children}
    </a>
  ),
}));

vi.mock("../../../components/Badges/VerifiedBadge", () => ({
  default: ({ text }) => <span data-testid="verified-badge">{text}</span>,
}));

vi.mock(
  "../../../features/ContactPhoneNumber/components/ViewContactPhoneNumber",
  () => ({
    default: () => <div data-testid="view-contact-phone-number" />,
  }),
);

vi.mock("../../../features/ProfileName/components/ViewProfileNameCard", () => ({
  default: () => <div data-testid="view-name-card" />,
}));

vi.mock(
  "../../../features/LanguagePreference/components/ViewLanguagePreference",
  () => ({
    default: () => <div data-testid="view-language-preferences" />,
  }),
);

vi.mock("../../../features/IDV/ProvenInformationCard", () => ({
  default: () => <div data-testid="proven-information-card" />,
}));

vi.mock(
  "../../../features/IDV/components/CompleteIdentityProofingNotice",
  () => ({
    default: () => <div data-testid="idv-complete-notice" />,
  }),
);

vi.mock("../../../features/IDV/components/IdentityInfoSuccessNotice", () => ({
  default: ({ showIDVSuccessNotice }) =>
    showIDVSuccessNotice ? <div data-testid="idv-success-notice" /> : null,
}));

describe("ProfileHome", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockLocationState = null;
  });

  it("renders the main container with role=main", () => {
    render(<ProfileHome />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });

  it("renders the page title", () => {
    render(<ProfileHome />);
    expect(
      screen.getByRole("heading", { name: "Personal information" }),
    ).toBeInTheDocument();
  });

  it("renders the Basic information section", () => {
    render(<ProfileHome />);
    expect(
      screen.getByRole("heading", { name: "Basic information" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("view-name-card")).toBeInTheDocument();
    expect(
      screen.queryByText("This name is used for display purposes only"),
    ).not.toBeInTheDocument();
  });

  it("renders the Contact information section", () => {
    render(<ProfileHome />);
    expect(
      screen.getByRole("heading", { name: "Contact information" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("view-contact-phone-number")).toBeInTheDocument();
  });

  it("renders the Communication section", () => {
    render(<ProfileHome />);
    expect(
      screen.getByRole("heading", { name: "Communication" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("view-language-preferences")).toBeInTheDocument();
  });

  it("renders the email with edit link when DEV_ONLY_FEATURE is true", () => {
    render(<ProfileHome />);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
    expect(screen.getByTestId("gcds-link")).toHaveTextContent("Edit");
  });

  it("hides the edit email link when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;
    render(<ProfileHome />);
    expect(screen.queryByTestId("gcds-link")).not.toBeInTheDocument();
  });

  it("renders the Proven information section when DEV_ONLY_FEATURE is true", () => {
    render(<ProfileHome />);
    expect(screen.getByTestId("idv-complete-notice")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Proven information" }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("proven-information-card")).toBeInTheDocument();
  });

  it("hides the Proven information section when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;
    render(<ProfileHome />);
    expect(screen.queryByTestId("idv-complete-notice")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Proven information" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId("proven-information-card"),
    ).not.toBeInTheDocument();
  });

  it("renders the verified badge for proven information when DEV_ONLY_FEATURE is true", () => {
    render(<ProfileHome />);
    const badges = screen.getAllByTestId("verified-badge");
    expect(
      badges.some((b) => b.textContent === "Proven January 27, 2026"),
    ).toBe(true);
  });

  it("renders the IDV success notice when location state enables it and DEV_ONLY_FEATURE is true", () => {
    mockLocationState = { showIDVSuccessNotice: true };
    render(<ProfileHome />);
    expect(screen.getByTestId("idv-success-notice")).toBeInTheDocument();
  });

  it("hides the complete identity proofing notice when location state enables success notice", () => {
    mockLocationState = { showIDVSuccessNotice: true };
    render(<ProfileHome />);
    expect(screen.queryByTestId("idv-complete-notice")).not.toBeInTheDocument();
  });

  it("hides the IDV success notice when showIDVSuccessNotice is false", () => {
    render(<ProfileHome />);
    expect(screen.queryByTestId("idv-success-notice")).not.toBeInTheDocument();
  });

  it("shows only IdentityInfoSuccessNotice when location state enables success notice", () => {
    mockLocationState = { showIDVSuccessNotice: true };
    render(<ProfileHome />);
    expect(screen.getByTestId("idv-success-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("idv-complete-notice")).not.toBeInTheDocument();
  });

  it("shows only CompleteIdentityProofingNotice when location state does not enable success notice", () => {
    mockLocationState = { showIDVSuccessNotice: false };
    render(<ProfileHome />);
    expect(screen.getByTestId("idv-complete-notice")).toBeInTheDocument();
    expect(screen.queryByTestId("idv-success-notice")).not.toBeInTheDocument();
  });

  it("hides the IDV success notice when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;
    mockLocationState = { showIDVSuccessNotice: true };
    render(<ProfileHome />);
    expect(screen.queryByTestId("idv-success-notice")).not.toBeInTheDocument();
  });
});
