import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import ConfirmIdentityDetails from "../ConfirmIdentityDetails";
import { identityVerificationApi } from "../api/identityVerificationApi";

const mockNavigate = vi.fn();
let mockDevOnlyFeature = true;
let mockJourneyType;
let mockUserState = {
  userProfile: {
    name: {
      formatted: "Jane Doe",
    },
  },
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en", journeyType: mockJourneyType }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../api/identityVerificationApi", () => ({
  identityVerificationApi: {
    getPostIdvRedirectUrl: vi.fn().mockResolvedValue({
      data: { redirect_url: "https://rp.example.com/service/return" },
    }),
  },
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: mockUserState,
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../utils/constants", () => ({
  get DEV_ONLY_FEATURE() {
    return mockDevOnlyFeature;
  },
  PAGES: {
    editProfileNamePage: "EditProfileNamePage",
    editEmailPage: "EditEmailPage",
    editContactPhoneNumberPage: "EditContactPhoneNumberPage",
    idvStartIdentityProofingPage: "IdvStartIdentityProofingPage",
  },
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

vi.mock("../../LanguagePreference/components/ViewLanguagePreference", () => ({
  default: () => <div>Language preferences</div>,
}));

vi.mock("../../../components/Badges/VerifiedBadge", () => ({
  default: ({ text }) => <div data-testid="verified-badge">{text}</div>,
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, role }) => <div role={role}>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children, tag }) => {
    const Tag = tag ?? "h2";
    return <Tag>{children}</Tag>;
  },
  GcdsText: ({ children }) => <p>{children}</p>,
  GcdsLink: ({ children, href, onGcdsClick }) => (
    <a
      href={href}
      onClick={(event) => {
        event.preventDefault();
        onGcdsClick?.({
          preventDefault: vi.fn(),
          detail: href,
        });
      }}
    >
      {children}
    </a>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole }) => (
    <button
      data-testid={buttonRole === "secondary" ? "secondary-button" : "button"}
      onClick={(event) => onGcdsClick?.(event)}
    >
      {children}
    </button>
  ),
  GcdsNotice: ({ children, type, noticeTitle, noticeTitleTag }) => {
    const TitleTag = noticeTitleTag ?? "h2";
    return (
      <div data-testid={`notice-${type}`}>
        {noticeTitle ? <TitleTag>{noticeTitle}</TitleTag> : null}
        {children}
      </div>
    );
  },
}));

describe("ConfirmIdentityDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDevOnlyFeature = true;
    mockJourneyType = undefined;
    Object.defineProperty(window, "location", {
      configurable: true,
      value: {
        ...window.location,
        assign: vi.fn(),
      },
    });
    mockUserState = {
      userProfile: {
        name: {
          formatted: "Jane Doe",
        },
      },
      relyingPartyInfo: {
        linkName: "CRA",
        url: "https://rp.example.com/service",
        localized: {
          en: { name: "CRA", url: "https://rp.example.com/service" },
        },
      },
    };
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockDevOnlyFeature = false;

    const { container } = render(<ConfirmIdentityDetails />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the core page sections", () => {
    render(<ConfirmIdentityDetails />);

    expect(
      screen.getByRole("heading", {
        name: "Confirm what will be saved to your CanadaLogin",
      }),
    ).toBeInTheDocument();
  });

  it("shows verified badge", () => {
    render(<ConfirmIdentityDetails />);

    const badges = screen.getAllByTestId("verified-badge");
    expect(
      badges.some((b) => b.textContent === "Proven January 27, 2026"),
    ).toBe(true);
  });

  it("shows the existing RP success notice when RP details are available", () => {
    render(<ConfirmIdentityDetails />);

    expect(
      screen.getByText(
        "Your identity information was successfully verified and proofing is complete.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "You're almost done. Confirm and save your details to CanadaLogin, then share the requested information with CRA to get access.",
      ),
    ).toBeInTheDocument();
  });

  it("shows the new no-RP success notice when RP details are missing", () => {
    mockUserState = {
      ...mockUserState,
      relyingPartyInfo: null,
    };

    render(<ConfirmIdentityDetails />);

    expect(
      screen.getByText("Your CanadaLogin has succesfully saved your changes"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Continue with accessing the service"),
    ).toBeInTheDocument();
  });

  it("navigates to start identity proofing when Update information is clicked", () => {
    render(<ConfirmIdentityDetails />);

    fireEvent.click(screen.getByRole("button", { name: "Update information" }));

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/IdvStartIdentityProofingPage",
    );
  });

  it("redirects to the stored RP target when Confirm and continue is clicked", async () => {
    mockJourneyType = "required";

    render(<ConfirmIdentityDetails />);

    fireEvent.click(
      screen.getByRole("button", { name: "Confirm and continue" }),
    );

    await waitFor(() => {
      expect(identityVerificationApi.getPostIdvRedirectUrl).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://rp.example.com/service/return",
      );
    });
  });
});
