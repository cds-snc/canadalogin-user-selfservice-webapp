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

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options) => {
      const translations = {
        "ConfirmIdentityDetails.successNoticeTitle": "Success",
        "ConfirmIdentityDetails.successNoticeDescription":
          "You proved your identity with {{appName}}.",
        "ConfirmIdentityDetails.pageTitle": "Saved to your CanadaLogin",
        "ConfirmIdentityDetails.description": "Your information has been saved",
        "ConfirmIdentityDetails.confirmAndContinue": "Continue",
      };
      const text = translations[key];
      return options?.appName
        ? text?.replace("{{appName}}", options.appName)
        : text || key;
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("../api/identityVerificationApi", () => ({
  identityVerificationApi: {
    getClaims: vi.fn().mockResolvedValue({
      status: "verified",
      verified_claims: {
        verification: {
          time: "2026-01-27T00:00:00Z",
        },
      },
    }),
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
    ProfileHome: "ProfileHome",
  },
}));

vi.mock("../constants", () => ({
  IDV_JOURNEY_TYPE: {
    REQUIRED: "required",
  },
}));

vi.mock("../../../hooks/useRelyingPartyInfo", () => ({
  useRelyingPartyInfo: () => ({
    relyingPartyUrl: "https://rp.example.com/service",
    relyingPartyName: "CRA",
    hasRelyingParty: true,
  }),
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

vi.mock("../../LanguagePreference/components/ViewLanguagePreference", () => ({
  default: () => <div>Language preferences</div>,
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
  GcdsIcon: ({ name, className, size }) => (
    <span data-testid={`icon-${name}`} className={className} data-size={size}>
      {name}
    </span>
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

vi.mock("../../../components/InfoBlocks/AccessibleNotice", () => ({
  default: ({ noticeTitle, children }) => (
    <div>
      {noticeTitle && <div>{noticeTitle}</div>}
      {children}
    </div>
  ),
}));

vi.mock("../../../components/Badges/VerifiedBadge", () => ({
  default: ({ text }) => <div>{text}</div>,
}));

vi.mock("../ProvenInformationCard", () => ({
  default: () => <div>Proven Information Card</div>,
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
        name: "Saved to your CanadaLogin",
      }),
    ).toBeInTheDocument();
  });

  it("redirects to the stored RP target when Continue is clicked", async () => {
    mockJourneyType = "required";

    render(<ConfirmIdentityDetails />);

    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(identityVerificationApi.getPostIdvRedirectUrl).toHaveBeenCalled();
      expect(window.location.assign).toHaveBeenCalledWith(
        "https://rp.example.com/service/return",
      );
    });
  });
});
