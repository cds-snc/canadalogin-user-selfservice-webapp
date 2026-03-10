import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useParams, useNavigate } from "react-router";
import ViewLanguagePreferences from "../components/ViewLanguagePreference.jsx";
import { useUser } from "../../../components/Providers/useUser";

// Mock React Router hooks
vi.mock("react-router", () => ({
  useParams: vi.fn(),
  useNavigate: vi.fn(),
}));

// Mock useUser hook
vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(),
}));

// Mock route helpers
vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(() => `/en/edit-language-preferences`),
}));

// Mock constants
vi.mock("../../../utils/constants", () => ({
  PAGES: {
    editLanguagePreferences: "edit-language-preferences",
  },
  LANGUAGE_DISPLAY_NAMES: {
    en: {
      en: "English",
      fr: "French",
    },
    fr: {
      en: "Anglais",
      fr: "Français",
    },
  },
}));

// Mock GCDS components with proper prop handling
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsHeading: ({ children, marginTop, ...props }) => (
    <h3 data-testid="gcds-heading" {...props} style={{ marginTop }}>
      {children}
    </h3>
  ),
  GcdsGrid: ({ children, className, ...props }) => (
    <div data-testid="gcds-grid" className={className} {...props}>
      {children}
    </div>
  ),
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
  ),
  GcdsLink: ({ children, href, onGcdsClick, ...props }) => {
    const handleClick = (e) => {
      e.preventDefault();
      if (onGcdsClick) {
        onGcdsClick({ detail: href, preventDefault: () => {} });
      }
    };

    return (
      <a data-testid="gcds-link" href={href} onClick={handleClick} {...props}>
        {children}
      </a>
    );
  },
}));

describe("ViewLanguagePreferences Component", () => {
  const mockNavigate = vi.fn();
  const mockPageContent = {
    5: "Edit",
    13: "Language preference",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  describe("Component Rendering", () => {
    it("renders with correct heading text", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByText("Language preference")).toBeInTheDocument();
    });

    it("renders edit link with correct text", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      const editLink = screen.getByTestId("gcds-link");
      expect(editLink).toBeInTheDocument();
      expect(editLink).toHaveTextContent("Edit");
    });

    it("renders all required components", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-grid")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-link")).toBeInTheDocument();
    });
  });

  describe("Language Display Logic", () => {
    it("displays 'English' when current language is 'en' and preferred is 'en'", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByText("English")).toBeInTheDocument();
    });

    it("displays 'French' when current language is 'en' and preferred is 'fr'", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "fr",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByText("French")).toBeInTheDocument();
    });

    it("displays 'Français' when current language is 'fr' and preferred is 'fr'", () => {
      useParams.mockReturnValue({ language: "fr" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "fr",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByText("Français")).toBeInTheDocument();
    });

    it("displays 'Anglais' when current language is 'fr' and preferred is 'en'", () => {
      useParams.mockReturnValue({ language: "fr" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByText("Anglais")).toBeInTheDocument();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles empty preferred language gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
    });

    it("handles null user profile gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: null,
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
    });

    it("handles null state gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: null,
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
    });

    it("handles undefined state gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({});

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
    });
  });

  describe("Navigation Functionality", () => {
    it("navigates to edit language preferences when edit link is clicked", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      const editLink = screen.getByTestId("gcds-link");
      fireEvent.click(editLink);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/edit-language-preferences",
      );
      expect(mockNavigate).toHaveBeenCalledTimes(1);
    });

    it("calls preventDefault and navigates when link is clicked", () => {
      useParams.mockReturnValue({ language: "fr" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "fr",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      const editLink = screen.getByTestId("gcds-link");

      // Mock preventDefault to verify it's called
      const mockPreventDefault = vi.fn();
      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
      });
      clickEvent.preventDefault = mockPreventDefault;

      // Trigger the click with our custom event
      editLink.dispatchEvent(clickEvent);

      expect(mockPreventDefault).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/edit-language-preferences",
      );
    });

    it("calls navigate with correct path for French language", () => {
      useParams.mockReturnValue({ language: "fr" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={mockPageContent} />);

      const editLink = screen.getByTestId("gcds-link");
      fireEvent.click(editLink);

      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/edit-language-preferences",
      );
    });
  });

  describe("Props and Data Flow", () => {
    it("uses pageContent prop correctly", () => {
      const customPageContent = {
        5: "Modifier",
        13: "Préférence de langue",
      };

      useParams.mockReturnValue({ language: "fr" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "fr",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={customPageContent} />);

      expect(screen.getByText("Préférence de langue")).toBeInTheDocument();
      expect(screen.getByText("Modifier")).toBeInTheDocument();
    });

    it("handles missing pageContent keys gracefully", () => {
      const incompletePageContent = {};

      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en",
          },
        },
      });

      render(<ViewLanguagePreferences pageContent={incompletePageContent} />);

      // Should render without crashing
      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-link")).toBeInTheDocument();
    });
  });
});
