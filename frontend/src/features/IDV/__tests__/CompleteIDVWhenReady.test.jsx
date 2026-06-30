import "@testing-library/jest-dom/vitest";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CompleteIdentityProofingPage from "../CompleteIDVWhenReady";
import { authService } from "../../../services/authService";

const mockSetLoading = vi.hoisted(() => vi.fn());
const mockNavigate = vi.hoisted(() => vi.fn());

const mockFlags = vi.hoisted(() => ({
  devOnlyFeature: true,
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/routeHelpers", () => ({
  path: (pageId, params) => `/${params?.language ?? "en"}/${pageId}`,
}));

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(),
}));

vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    get DEV_ONLY_FEATURE() {
      return mockFlags.devOnlyFeature;
    },
    PAGES: { ...actual.PAGES },
  };
});

vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({ setLoading: mockSetLoading }),
}));

vi.mock("../../../services/authService", () => ({
  authService: { logout: vi.fn() },
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
      data-testid={
        buttonRole === "secondary" ? "signout-button" : "start-button"
      }
      onClick={(e) => onGcdsClick && onGcdsClick(e)}
    >
      {children}
    </button>
  ),
  GcdsLink: ({ children, href, ...props }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="gcds-notice">
      <span>{noticeTitle}</span>
      {children}
    </div>
  ),
}));

import { useUser } from "../../../components/Providers/useUser";

const defaultUserState = {
  dispatch: vi.fn(),
  state: {
    relyingPartyInfo: {
      linkName: "Service Portal",
      url: "https://example.test",
      localized: {
        en: { name: "Localized RP", url: "https://example.test/en" },
      },
    },
  },
};

const setup = (userState = defaultUserState) => {
  vi.mocked(useUser).mockReturnValue(userState);
  return render(<CompleteIdentityProofingPage />);
};

describe("CompleteIdentityProofingPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockFlags.devOnlyFeature = true;

    delete window.location;
    window.location = {
      _href: "",
      get href() {
        return this._href;
      },
      set href(value) {
        this._href = value;
      },
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("DEV_ONLY_FEATURE gating", () => {
    it("renders nothing when DEV_ONLY_FEATURE is false", () => {
      mockFlags.devOnlyFeature = false;

      const { container } = setup();

      expect(container).toBeEmptyDOMElement();
    });

    it("renders page content when DEV_ONLY_FEATURE is true", () => {
      setup();

      expect(
        screen.getByRole("heading", {
          name: "Complete identity proofing when you're ready",
        }),
      ).toBeInTheDocument();
    });
  });

  describe("RP name resolution", () => {
    it("uses localized RP name when available", () => {
      setup();

      expect(
        screen.getByText(
          "To access the Localized RP, you need to complete identity proofing first",
        ),
      ).toBeInTheDocument();
    });

    it("falls back to linkName when localized RP name is missing", () => {
      setup({
        dispatch: vi.fn(),
        state: {
          relyingPartyInfo: {
            linkName: "Fallback Link Name",
            localized: {},
          },
        },
      });

      expect(
        screen.getByText(
          "To access the Fallback Link Name, you need to complete identity proofing first",
        ),
      ).toBeInTheDocument();
    });

    it("falls back to app name when both localized name and linkName are unavailable", () => {
      setup({
        dispatch: vi.fn(),
        state: { relyingPartyInfo: { localized: {} } },
      });

      expect(
        screen.getByText(
          "To access the CanadaLogin, you need to complete identity proofing first",
        ),
      ).toBeInTheDocument();
    });

    it("renders body text and notice section", () => {
      setup();

      expect(
        screen.getByText(
          "When you're ready, sign back in to your CanadaLogin account and you'll be brought back to this step automatically.",
        ),
      ).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-notice").length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          "Don't have the required documents for identity proofing?",
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Start Identity button", () => {
    it("renders the start identity button", () => {
      setup();

      expect(screen.getByTestId("start-button")).toBeInTheDocument();
      expect(screen.getByTestId("start-button")).toHaveTextContent(
        "Start identity proofing now",
      );
    });

    it("navigates to /idv when start identity button is clicked", async () => {
      setup();

      await act(async () => {
        screen.getByTestId("start-button").click();
      });

      expect(mockNavigate).toHaveBeenCalledWith("/en/StartIdentityProofing");
    });

    it("does not trigger logout when start identity button is clicked", async () => {
      setup();

      await act(async () => {
        screen.getByTestId("start-button").click();
      });

      expect(authService.logout).not.toHaveBeenCalled();
      expect(mockSetLoading).not.toHaveBeenCalled();
    });
  });

  describe("Warning notice for missing documents", () => {
    it("renders the warning notice header", () => {
      setup();

      expect(
        screen.getByText(
          "Don't have the required documents for identity proofing?",
        ),
      ).toBeInTheDocument();
    });

    it("renders the warning notice text with localized RP name", () => {
      setup();

      expect(
        screen.getByText(
          "If you do not have the required identity documents, or are unable to complete the proofing process because of some other circumstances, you will need to contact Localized RP directly to ask about alternative ways to verify your identity and access the service.",
        ),
      ).toBeInTheDocument();
    });

    it("renders the contact link in the warning notice", () => {
      setup();

      const contactLink = screen.getByRole("link", {
        name: "RP Service Portal contact",
      });
      expect(contactLink).toBeInTheDocument();
      expect(contactLink).toHaveAttribute("href", "#");
    });

    it("uses fallback app name when RP info is not available", () => {
      setup({
        dispatch: vi.fn(),
        state: { relyingPartyInfo: null },
      });

      expect(
        screen.getByText(
          /will need to contact CanadaLogin directly to ask about alternative ways/,
        ),
      ).toBeInTheDocument();
    });
  });

  describe("Logout flow", () => {
    it("sets signing-out loading state and calls logout on click", async () => {
      vi.mocked(authService.logout).mockResolvedValue({
        data: { redirect_url: "https://example.test/logout" },
      });
      setup();

      await act(async () => {
        screen.getByTestId("signout-button").click();
      });

      expect(mockSetLoading).toHaveBeenNthCalledWith(
        1,
        true,
        "Signing you out...",
      );
      expect(authService.logout).toHaveBeenCalledTimes(1);
    });

    it("does not redirect via window.location when redirect_url is returned", async () => {
      vi.mocked(authService.logout).mockResolvedValue({
        data: { redirect_url: "https://example.test/logout" },
      });
      setup();

      await act(async () => {
        screen.getByTestId("signout-button").click();
      });

      expect(window.location.href).toBe("");
    });

    it("redirects to / when logout returns no redirect_url", async () => {
      vi.mocked(authService.logout).mockResolvedValue({ data: {} });
      setup();

      await act(async () => {
        screen.getByTestId("signout-button").click();
      });

      expect(window.location.href).toBe("/");
    });

    it("shows failure message then redirects to / after 2s on logout error", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      vi.mocked(authService.logout).mockRejectedValue(
        new Error("Network error"),
      );
      setup();

      await act(async () => {
        screen.getByTestId("signout-button").click();
      });

      expect(mockSetLoading).toHaveBeenNthCalledWith(
        1,
        true,
        "Signing you out...",
      );
      expect(mockSetLoading).toHaveBeenNthCalledWith(
        2,
        true,
        "Failed to sign you out. Redirecting...",
      );
      expect(window.location.href).toBe("");

      await act(async () => {
        vi.runAllTimers();
      });

      expect(window.location.href).toBe("/");

      consoleErrorSpy.mockRestore();
    });
  });
});
