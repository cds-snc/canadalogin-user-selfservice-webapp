import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PartnerLinkSuccessPage from "../Online/PartnerLinkSuccessPage";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockPartnerId = "BC";
let mockLanguage = "en";
let mockJourneyType = "manage-account";

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({
      language: mockLanguage,
      journeyType: mockJourneyType,
      partnerId: mockPartnerId,
    }),
  };
});

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
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (_page, { language, journeyType } = {}) =>
    `/${language ?? "en"}/identity-verification/${journeyType ?? "manage-account"}/details-confirmation`,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsButton: ({ children, onClick }) => (
    <button data-testid="continue-button" onClick={onClick}>
      {children}
    </button>
  ),
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <h2>{noticeTitle}</h2>
      {children}
    </div>
  ),
}));

describe("PartnerLinkSuccessPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockPartnerId = "BC";
    mockLanguage = "en";
    mockJourneyType = "manage-account";
  });

  it("renders BC Service Card partner success content", () => {
    render(<PartnerLinkSuccessPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your CanadaLogin account is now connected to your BC Service Card",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: "You can also use your BC Service Card to sign in",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "We've linked your account sign in methods so you can now use your BC Service Card to sign in or recover your account in addition to your selected sign in method.",
      ),
    ).toBeInTheDocument();
  });

  it("renders Alberta.ca Account partner content", () => {
    mockPartnerId = "AB";

    render(<PartnerLinkSuccessPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your CanadaLogin account is now connected to your Alberta.ca Account",
      }),
    ).toBeInTheDocument();
  });

  it("renders Quebec partner content", () => {
    mockPartnerId = "QC";

    render(<PartnerLinkSuccessPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your CanadaLogin account is now connected to your Québec Digital Identity",
      }),
    ).toBeInTheDocument();
  });

  it("accepts lowercase partner IDs from the route", () => {
    mockPartnerId = "bc";

    render(<PartnerLinkSuccessPage />);

    expect(
      screen.getByRole("heading", {
        name: "Your CanadaLogin account is now connected to your BC Service Card",
      }),
    ).toBeInTheDocument();
  });

  it("navigates to details confirmation when Continue is clicked", () => {
    render(<PartnerLinkSuccessPage />);

    fireEvent.click(screen.getByTestId("continue-button"));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/identity-verification/manage-account/details-confirmation",
    );
  });

  it("renders nothing for unsupported partner IDs", () => {
    mockPartnerId = "ON";

    const { container } = render(<PartnerLinkSuccessPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<PartnerLinkSuccessPage />);

    expect(container).toBeEmptyDOMElement();
  });
});
