import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { useParams, useLocation, useNavigate } from "react-router";
import SuccessfullyUpdatedLanguage from "../components/SuccessfullyUpdated.jsx";
import { useUser } from "../../../components/Providers/useUser.tsx";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: vi.fn(),
}));

vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: vi.fn(() => ({
    1: "Your language preference has been successfully updated to",
    2: "What happens next?",
    3: "Updates to your language preference",
    4: "Your language preference will be applied to all communications and notifications.",
    5: "To change the interface language,",
    6: "Return to profile",
    7: "Sign out",
    8: "update your browser settings",
  })),
  convertLanguageToLanguageCode: vi.fn((language) => {
    if (language === "en" || language === "en-ca") return "en";
    if (language === "fr" || language === "fr-ca") return "fr";
    return language;
  }),
}));

vi.mock("../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page, params) => {
    if (page === "profile-home") return `/${params.language}/profile`;
    if (page === "edit-language-preferences")
      return `/${params.language}/edit-language`;
    return `/${params.language}/test-path`;
  }),
}));

vi.mock("../../../utils/constants.jsx", () => ({
  PAGES: {
    successfullyUpdatedLanguage: "success",
    ProfileHome: "profile-home",
    editLanguagePreferences: "edit-language-preferences",
  },
  LANGUAGE_DISPLAY_NAMES: {
    en: {
      "en-ca": "English",
      "fr-ca": "French",
    },
    fr: {
      "en-ca": "Anglais",
      "fr-ca": "Français",
    },
  },
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => (
    <div data-testid="gcds-container" {...props}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag, ...props }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid={`gcds-heading-${tag}`} {...props}>
        {children}
      </Tag>
    );
  },
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
  ),
  GcdsNotice: ({ children, type, noticeTitle, noticeTitleTag, ...props }) => (
    <div data-testid="gcds-notice" data-type={type} {...props}>
      {noticeTitle && <div data-testid="notice-title">{noticeTitle}</div>}
      {children}
    </div>
  ),
  GcdsButton: ({ children, buttonRole, onGcdsClick, ...props }) => {
    const handleClick = (e) => {
      e.preventDefault();
      if (onGcdsClick) {
        onGcdsClick({ preventDefault: () => {} });
      }
    };

    return (
      <button
        data-testid={
          buttonRole === "secondary"
            ? "gcds-button-secondary"
            : "gcds-button-primary"
        }
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  },
  GcdsGrid: ({ children, columns, gap, ...props }) => (
    <div
      data-testid="gcds-grid"
      data-columns={columns}
      data-gap={gap}
      {...props}
    >
      {children}
    </div>
  ),
  GcdsLink: ({ children, href, ...props }) => (
    <a data-testid="gcds-link" href={href} {...props}>
      {children}
    </a>
  ),
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("SuccessfullyUpdatedLanguage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const setup = (
    language = "en",
    preferredLanguage = "fr-ca",
    locationState = {
      updatedLanguage: {
        languageCode: "fr",
        updatedPreferredLanguage: "fr-ca",
      },
    },
  ) => {
    useParams.mockReturnValue({ language });
    useLocation.mockReturnValue({ state: locationState });
    useUser.mockReturnValue({
      state: {
        userProfile: {
          preferredLanguage,
        },
      },
    });

    return render(<SuccessfullyUpdatedLanguage />);
  };

  describe("Component Rendering", () => {
    it("renders success notice with updated language", () => {
      setup();

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toBeInTheDocument();
      expect(notice).toHaveAttribute("data-type", "success");
    });

    it("displays the success message with language name", () => {
      setup();

      const notice = screen.getByTestId("gcds-notice");
      const noticeText = within(notice).getByTestId("gcds-text");

      expect(noticeText).toHaveTextContent(
        "Your language preference has been successfully updated to French",
      );
    });

    it("renders the main heading", () => {
      setup();

      expect(screen.getByTestId("gcds-heading-h1")).toBeInTheDocument();
      expect(screen.getByText("What happens next?")).toBeInTheDocument();
    });

    it("renders the subheading", () => {
      setup();

      expect(screen.getByTestId("gcds-heading-h4")).toBeInTheDocument();
      expect(
        screen.getByText("Updates to your language preference"),
      ).toBeInTheDocument();
    });

    it("renders informational text", () => {
      setup();

      const textElements = screen.getAllByTestId("gcds-text");
      expect(textElements.length).toBeGreaterThan(0);
      expect(
        screen.getByText(
          "Your language preference will be applied to all communications and notifications.",
        ),
      ).toBeInTheDocument();
    });

    it("renders browser settings link", () => {
      setup();

      const link = screen.getByTestId("gcds-link");
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "#");
      expect(
        screen.getByText("update your browser settings"),
      ).toBeInTheDocument();
    });

    it("renders return to profile button", () => {
      setup();

      const primaryButton = screen.getByTestId("gcds-button-primary");
      expect(primaryButton).toBeInTheDocument();
      expect(primaryButton).toHaveTextContent("Return to profile");
    });

    it("renders sign out button", () => {
      setup();

      const secondaryButton = screen.getByTestId("gcds-button-secondary");
      expect(secondaryButton).toBeInTheDocument();
      expect(secondaryButton).toHaveTextContent("Sign out");
    });

    it("renders buttons in a grid layout", () => {
      setup();

      const grid = screen.getByTestId("gcds-grid");
      expect(grid).toBeInTheDocument();
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
    });
  });

  describe("Navigation Functionality", () => {
    it("navigates to profile when 'Return to profile' is clicked", () => {
      setup();

      const primaryButton = screen.getByTestId("gcds-button-primary");
      fireEvent.click(primaryButton);

      expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
    });

    it("navigates to profile when 'Sign out' is clicked", () => {
      setup();

      const secondaryButton = screen.getByTestId("gcds-button-secondary");
      fireEvent.click(secondaryButton);

      expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
    });

    it("uses correct language code in navigation path", () => {
      setup("fr", "fr-ca");

      const primaryButton = screen.getByTestId("gcds-button-primary");
      fireEvent.click(primaryButton);

      expect(mockNavigate).toHaveBeenCalledWith("/fr/profile");
    });

    it("redirects to edit page when updatedLanguage is missing", () => {
      setup("en", "en-ca", null);

      expect(mockNavigate).toHaveBeenCalledWith("/en/edit-language");
    });

    it("redirects to edit page when location state is undefined", () => {
      useParams.mockReturnValue({ language: "en" });
      useLocation.mockReturnValue({ state: undefined });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en-ca",
          },
        },
      });

      render(<SuccessfullyUpdatedLanguage />);

      expect(mockNavigate).toHaveBeenCalledWith("/en/edit-language");
    });

    it("redirects to edit page when updatedLanguage.languageCode is missing", () => {
      const { container } = setup("en", "en-ca", {
        updatedLanguage: {
          updatedPreferredLanguage: "fr-ca",
        },
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Language Display", () => {
    it("displays French when preferred language is fr-ca in English interface", () => {
      setup("en", "fr-ca");

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveTextContent("French");
    });

    it("displays Français when preferred language is fr-ca in French interface", () => {
      setup("fr", "fr-ca");

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveTextContent("Français");
    });

    it("displays English when preferred language is en-ca in English interface", () => {
      setup("en", "en-ca", {
        updatedLanguage: {
          languageCode: "en",
          updatedPreferredLanguage: "en-ca",
        },
      });

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveTextContent("English");
    });

    it("displays Anglais when preferred language is en-ca in French interface", () => {
      useParams.mockReturnValue({ language: "fr" });
      useLocation.mockReturnValue({
        state: {
          updatedLanguage: {
            languageCode: "en",
            updatedPreferredLanguage: "en-ca",
          },
        },
      });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en-ca",
          },
        },
      });

      render(<SuccessfullyUpdatedLanguage />);

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveTextContent("Anglais");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("returns null when languageCode is missing from updatedLanguage", () => {
      const { container } = setup("en", "en-ca", {
        updatedLanguage: {
          updatedPreferredLanguage: "fr-ca",
        },
      });

      expect(container.firstChild).toBeNull();
    });

    it("handles missing userProfile gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useLocation.mockReturnValue({
        state: {
          updatedLanguage: {
            languageCode: "fr",
            updatedPreferredLanguage: "fr-ca",
          },
        },
      });
      useUser.mockReturnValue({
        state: {
          userProfile: null,
        },
      });

      render(<SuccessfullyUpdatedLanguage />);

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("handles missing user state gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useLocation.mockReturnValue({
        state: {
          updatedLanguage: {
            languageCode: "fr",
            updatedPreferredLanguage: "fr-ca",
          },
        },
      });
      useUser.mockReturnValue({
        state: null,
      });

      render(<SuccessfullyUpdatedLanguage />);

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("handles undefined preferredLanguage gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useLocation.mockReturnValue({
        state: {
          updatedLanguage: {
            languageCode: "fr",
            updatedPreferredLanguage: "fr-ca",
          },
        },
      });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: undefined,
          },
        },
      });

      render(<SuccessfullyUpdatedLanguage />);

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("handles empty string preferredLanguage", () => {
      useParams.mockReturnValue({ language: "en" });
      useLocation.mockReturnValue({
        state: {
          updatedLanguage: {
            languageCode: "fr",
            updatedPreferredLanguage: "fr-ca",
          },
        },
      });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "",
          },
        },
      });

      render(<SuccessfullyUpdatedLanguage />);

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("returns null when updatedLanguage exists but languageCode is null", () => {
      const { container } = setup("en", "en-ca", {
        updatedLanguage: {
          languageCode: null,
          updatedPreferredLanguage: "fr-ca",
        },
      });

      expect(container.firstChild).toBeNull();
    });

    it("returns null when updatedLanguage exists but languageCode is empty string", () => {
      const { container } = setup("en", "en-ca", {
        updatedLanguage: {
          languageCode: "",
          updatedPreferredLanguage: "fr-ca",
        },
      });

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Event Handlers", () => {
    it("prevents default behavior on primary button click", () => {
      setup();

      const primaryButton = screen.getByTestId("gcds-button-primary");
      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

      primaryButton.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("prevents default behavior on secondary button click", () => {
      setup();

      const secondaryButton = screen.getByTestId("gcds-button-secondary");
      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

      secondaryButton.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });
  });

  describe("Component Lifecycle", () => {
    it("redirects on mount when updatedLanguage is missing", () => {
      setup("en", "en-ca", null);

      expect(mockNavigate).toHaveBeenCalledTimes(1);
      expect(mockNavigate).toHaveBeenCalledWith("/en/edit-language");
    });

    it("does not redirect on mount when updatedLanguage is present", () => {
      setup("en", "fr-ca");

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("Content Structure", () => {
    it("renders all required GCDS components", () => {
      setup();

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-notice")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-heading-h1")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-heading-h4")).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-text")).toHaveLength(3);
      expect(screen.getByTestId("gcds-link")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-grid")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-button-primary")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-button-secondary")).toBeInTheDocument();
    });

    it("renders success notice with correct structure", () => {
      setup();

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-type", "success");

      const noticeText = notice.querySelector('[data-testid="gcds-text"]');
      expect(noticeText).toBeInTheDocument();
    });

    it("renders text content in correct order", () => {
      setup();

      const headings = screen.getAllByRole("heading");
      expect(headings[0]).toHaveTextContent("What happens next?");
      expect(headings[1]).toHaveTextContent(
        "Updates to your language preference",
      );
    });
  });

  describe("Button Styling", () => {
    it("applies correct styles to primary button", () => {
      setup();

      const primaryButton = screen.getByTestId("gcds-button-primary");
      expect(primaryButton).toHaveStyle({ width: "fit-content" });
    });

    it("applies correct styles to secondary button", () => {
      setup();

      const secondaryButton = screen.getByTestId("gcds-button-secondary");
      expect(secondaryButton).toHaveStyle({ width: "fit-content" });
    });
  });

  describe("Multiple Language Combinations", () => {
    it("correctly displays language names for all valid combinations", () => {
      const combinations = [
        { lang: "en", pref: "en-ca", expected: "English" },
        { lang: "en", pref: "fr-ca", expected: "French" },
        { lang: "fr", pref: "en-ca", expected: "Anglais" },
        { lang: "fr", pref: "fr-ca", expected: "Français" },
      ];

      combinations.forEach(({ lang, pref, expected }) => {
        vi.clearAllMocks();
        const { unmount } = setup(lang, pref, {
          updatedLanguage: {
            languageCode: pref.split("-")[0],
            updatedPreferredLanguage: pref,
          },
        });

        const notice = screen.getByTestId("gcds-notice");
        expect(notice).toHaveTextContent(expected);
        unmount();
      });
    });
  });

  describe("Accessibility", () => {
    it("uses semantic HTML heading tags", () => {
      setup();

      const h1 = screen.getByTestId("gcds-heading-h1");
      const h4 = screen.getByTestId("gcds-heading-h4");

      expect(h1.tagName).toBe("H1");
      expect(h4.tagName).toBe("H4");
    });

    it("provides descriptive button text", () => {
      setup();

      const primaryButton = screen.getByTestId("gcds-button-primary");
      const secondaryButton = screen.getByTestId("gcds-button-secondary");

      expect(primaryButton).toHaveTextContent("Return to profile");
      expect(secondaryButton).toHaveTextContent("Sign out");
    });
  });
});
