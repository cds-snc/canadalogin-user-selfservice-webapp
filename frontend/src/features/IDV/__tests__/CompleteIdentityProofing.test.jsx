import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CompleteIdentityProofingPage from "../required/CompleteIdentityProofing";
import { authService } from "../../../services/authService";

const mockNavigate = vi.fn();
const mockFlags = vi.hoisted(() => ({
  devOnlyFeature: true,
}));

const mockUseUserState = vi.hoisted(() => ({
  value: {
    state: {
      relyingPartyInfo: {
        linkName: "Service Portal",
        url: "https://example.test",
        localized: {
          en: {
            name: "Localized RP",
            url: "https://example.test/en",
          },
        },
      },
    },
  },
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => mockUseUserState.value,
}));

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
    PAGES: {
      ...actual.PAGES,
    },
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params.language}/${pageId}`,
}));

vi.mock("../../../services/authService", () => ({
  authService: {
    logout: vi.fn(),
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
  GcdsButton: ({ children, onGcdsClick, buttonRole }) => (
    <button
      data-testid={buttonRole === "secondary" ? "signout-button" : "start-button"}
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
    >
      {children}
    </button>
  ),
  GcdsLink: ({ children, href }) => <a href={href}>{children}</a>,
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
}));

describe("CompleteIdentityProofingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFlags.devOnlyFeature = true;
    mockUseUserState.value = {
      state: {
        relyingPartyInfo: {
          linkName: "Service Portal",
          url: "https://example.test",
          localized: {
            en: {
              name: "Localized RP",
              url: "https://example.test/en",
            },
          },
        },
      },
    };
  });

  it("renders nothing when DEV_ONLY_FEATURE is false", () => {
    mockFlags.devOnlyFeature = false;

    const { container } = render(<CompleteIdentityProofingPage />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders page content with localized relying party name", () => {
    render(<CompleteIdentityProofingPage />);

    expect(
      screen.getByRole("heading", {
        name: "Complete identity proofing when you're ready",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "To access the Localized RP, you need to complete identity proofing first",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "When you're ready, sign back in to your CanadaLogin account and you'll be brought back to this step automatically.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
    expect(screen.getByText("For more information")).toBeInTheDocument();
  });

  it("navigates to Start Identity Proofing when start button is clicked", () => {
    render(<CompleteIdentityProofingPage />);

    fireEvent.click(screen.getByTestId("start-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/en/IdvStartIdentityProofingPage");
  });

  it("calls authService.logout when sign out button is clicked", () => {
    render(<CompleteIdentityProofingPage />);

    fireEvent.click(screen.getByTestId("signout-button"));

    expect(authService.logout).toHaveBeenCalledTimes(1);
  });
});
