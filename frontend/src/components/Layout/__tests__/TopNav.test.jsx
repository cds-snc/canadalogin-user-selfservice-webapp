import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import TopNav from "../TopNav";
import { useUser } from "../../Providers/useUser";
import { useBreakpoints } from "../../../hooks/useBreakpoints";
import { authService } from "../../../services/authService";

// Mock dependencies
vi.mock("../../Providers/useUser");
vi.mock("../../../hooks/useBreakpoints");
vi.mock("../../../services/authService");
const mockSetLoading = vi.fn();
vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: vi.fn(() => ({ setLoading: mockSetLoading })),
}));
vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn((_page, { language }) => `/${language}/mock-path`),
}));
vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(() => ({
    t: (key) => {
      const translations = {
        "TopNavBar.appName": "CanadaLogin",
        "TopNavBar.home": "Home",
        "TopNavBar.personalInfo": "Personal information",
        "TopNavBar.securitySettings": "Security settings",
        "TopNavBar.returnTo": "Return to ",
        "TopNavBar.signOut": "Sign out",
        "TopNavBar.signingOut": "Signing you out...",
        "TopNavBar.signOutFailed": "Failed to sign you out. Redirecting...",
      };
      return translations[key] ?? key;
    },
    i18n: { language: "en" },
  })),
}));

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, slot, ...props }) => (
    <div data-testid="gcds-container" data-slot={slot} {...props}>
      {children}
    </div>
  ),
  GcdsNavLink: ({ children, href, slot, onClick }) => (
    <a
      data-testid="gcds-nav-link"
      href={href}
      data-slot={slot}
      onClick={onClick}
    >
      {children}
    </a>
  ),
  GcdsNavGroup: ({ children, ...props }) => (
    <div data-testid="gcds-nav-group" {...props}>
      {children}
    </div>
  ),
  GcdsText: ({ children, ...props }) => (
    <div data-testid="gcds-text" {...props}>
      {children}
    </div>
  ),
  GcdsTopNav: ({ children, slot, ...props }) => (
    <nav data-testid="gcds-top-nav" data-slot={slot} {...props}>
      {children}
    </nav>
  ),
}));

const mockDispatch = vi.fn();

const baseState = {
  relyingPartyInfo: null,
};

const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("TopNav", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useUser.mockReturnValue({ state: baseState, dispatch: mockDispatch });
    useBreakpoints.mockReturnValue({ mobile: false, tablet: false });
  });

  describe("desktop layout", () => {
    beforeEach(() => {
      useBreakpoints.mockReturnValue({ mobile: false, tablet: false });
    });

    it("renders the desktop top nav", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByTestId("gcds-top-nav")).toBeInTheDocument();
    });

    it("renders the app name as the home slot link", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      const homeLink = screen
        .getAllByTestId("gcds-nav-link")
        .find((el) => el.dataset.slot === "home");
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveTextContent("CanadaLogin");
    });

    it("renders Home, Personal information, Security settings, and Sign out links", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Personal information")).toBeInTheDocument();
      expect(screen.getByText("Security settings")).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    it("does not render the Return to link when relyingPartyInfo is null", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.queryByText(/Return to/)).not.toBeInTheDocument();
    });

    it("renders the Return to link when relyingPartyInfo is present", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "My Service",
            url: "https://my-service.example.com",
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Return to My Service")).toBeInTheDocument();
      expect(screen.getByText("Return to My Service")).toHaveAttribute(
        "href",
        "https://my-service.example.com",
      );
    });

    it("uses localized RP name and URL when available for the current language", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "My Service",
            url: "https://my-service.example.com",
            localized: {
              en: {
                name: "My Service EN",
                url: "https://my-service.example.com/en",
              },
              fr: {
                name: "Mon service FR",
                url: "https://my-service.example.com/fr",
              },
            },
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Return to My Service EN")).toBeInTheDocument();
      expect(screen.getByText("Return to My Service EN")).toHaveAttribute(
        "href",
        "https://my-service.example.com/en",
      );
    });

    it("falls back to linkName when localized entry for current language is absent", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "My Service",
            url: "https://my-service.example.com",
            localized: {
              fr: {
                name: "Mon service FR",
                url: "https://my-service.example.com/fr",
              },
            },
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Return to My Service")).toBeInTheDocument();
    });

    it("renders the Return to link when linkName is empty but relyingPartyInfo exists", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "",
            url: "https://my-service.example.com",
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      const returnLink = screen.getByRole("link", { name: /^Return to$/ });
      expect(returnLink).toBeInTheDocument();
      expect(returnLink).toHaveAttribute(
        "href",
        "https://my-service.example.com",
      );
    });

    it("renders the Return to link when url is empty but relyingPartyInfo exists", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "My Service",
            url: "",
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Return to My Service")).toBeInTheDocument();
      expect(screen.getByText("Return to My Service")).toHaveAttribute(
        "href",
        "",
      );
    });
  });

  describe("mobile/tablet layout", () => {
    beforeEach(() => {
      useBreakpoints.mockReturnValue({ mobile: true, tablet: false });
    });

    it("renders the app name as a text element in the menu container", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("CanadaLogin")).toBeInTheDocument();
    });

    it("renders navigation links inside the mobile top nav", () => {
      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Personal information")).toBeInTheDocument();
      expect(screen.getByText("Security settings")).toBeInTheDocument();
      expect(screen.getByText("Sign out")).toBeInTheDocument();
    });

    it("renders the Return to link on mobile when relyingPartyInfo is present", () => {
      useUser.mockReturnValue({
        state: {
          relyingPartyInfo: {
            linkName: "My Service",
            url: "https://my-service.example.com",
          },
        },
        dispatch: mockDispatch,
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      expect(screen.getByText("Return to My Service")).toBeInTheDocument();
    });
  });

  describe("logout", () => {
    beforeEach(() => {
      useBreakpoints.mockReturnValue({ mobile: false, tablet: false });
      delete window.location;
      window.location = { href: "" };
    });

    it("calls authService.logout and redirects to / when no redirect_url in response", async () => {
      authService.logout = vi.fn().mockResolvedValue({ data: {} });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Sign out"), {
        preventDefault: vi.fn(),
      });

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(window.location.href).toBe("/");
      });
    });

    it("calls authService.logout and does not redirect when redirect_url is present", async () => {
      authService.logout = vi.fn().mockResolvedValue({
        data: { redirect_url: "https://rp.example.com" },
      });

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Sign out"), {
        preventDefault: vi.fn(),
      });

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      // href should NOT have been set to "/"
      expect(window.location.href).not.toBe("/");
    });

    it("redirects to / after a delay when logout throws an error", async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      authService.logout = vi
        .fn()
        .mockRejectedValue(new Error("Network error"));

      render(
        <TestWrapper>
          <TopNav currentLang="en" />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText("Sign out"), {
        preventDefault: vi.fn(),
      });

      await waitFor(() => {
        expect(authService.logout).toHaveBeenCalled();
      });

      await vi.runAllTimersAsync();

      expect(window.location.href).toBe("/");
      vi.useRealTimers();
    });
  });
});
