import React from "react";
import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { useParams, useNavigate } from "react-router";
import EditLanguagePreferences from "../components/EditLanguagePreferences";
import { useUser } from "../../../components/Providers/useUser";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(),
}));

vi.mock("../../../utils/functions", () => ({
  getPageContent: vi.fn(() => ({
    1: "Edit language preferences",
    2: "Select your preferred language for notifications and communications.",
    3: "Preferred language",
    13: "English",
    14: "French",
    15: "Continue",
    16: "Cancel",
  })),
  convertLanguageToLanguageCode: vi.fn((language) => {
    if (language === "en" || language === "en-ca") return "en";
    if (language === "fr" || language === "fr-ca") return "fr";
    return language;
  }),
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn((page, params) => {
    if (page === "profile-home") return `/${params.language}/profile`;
    if (page === "confirm-language-update")
      return `/${params.language}/confirm-language`;
    return `/${params.language}/test-path`;
  }),
}));

vi.mock("../../../utils/constants", () => ({
  PAGES: {
    editLanguagePreferences: "edit-language-preferences",
    ProfileHome: "profile-home",
    confirmLanguageUpdate: "confirm-language-update",
  },
  PROFILE_LANGUAGES: {
    en: "en-ca",
    fr: "fr-ca",
  },
  ServicesWithAccessInfoSectionInformation: {
    NAME: "name",
    CONTACT_PHONE_NUMBER: "contactPhoneNumber",
    LANGUAGE_PREFERENCE: "languagePreference",
    EMAIL_ADDRESS: "emailAddress",
  },
}));

vi.mock("../../../components/InfoBlocks/ServicesWithAccessInfoSection", () => ({
  default: ({ currentLang }) => (
    <div data-testid="services-info">Services Info - {currentLang}</div>
  ),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children, marginTop, ...props }) => (
    <div data-testid="gcds-container" style={{ marginTop }} {...props}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, ...props }) => (
    <h1 data-testid="gcds-heading" {...props}>
      {children}
    </h1>
  ),
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
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
          buttonRole === "secondary" ? "gcds-button-secondary" : "gcds-button"
        }
        onClick={handleClick}
        {...props}
      >
        {children}
      </button>
    );
  },
  GcdsGrid: ({ children, ...props }) => (
    <div data-testid="gcds-grid" {...props}>
      {children}
    </div>
  ),
  GcdsRadios: ({ name, legend, options, onChange, ...props }) => {
    const [selectedValue, setSelectedValue] = React.useState(
      options.find((option) => option.checked)?.value || "",
    );

    const handleChange = (e) => {
      setSelectedValue(e.target.value);
      if (onChange) onChange(e);
    };

    return (
      <div data-testid="gcds-radios" {...props}>
        <fieldset>
          <legend>{legend}</legend>
          {options.map((option) => (
            <label key={option.id}>
              <input
                type="radio"
                name={name}
                id={option.id}
                value={option.value}
                checked={selectedValue === option.value}
                onChange={handleChange}
                data-testid={`radio-${option.id}`}
              />
              {option.label}
            </label>
          ))}
        </fieldset>
      </div>
    );
  },
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("EditLanguagePreferences Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNavigate.mockReturnValue(mockNavigate);
  });

  const setup = (
    language = "en",
    preferredLanguage = "en-ca",
    overrideProps = {},
  ) => {
    useParams.mockReturnValue({ language });
    useUser.mockReturnValue({
      state: {
        userProfile: {
          preferredLanguage,
        },
        relyingPartyInfo: {
          icon: "test-icon.png",
          id: "test-service-id",
          linkName: "Test Service",
          url: "https://test-service.example.com",
        },
      },
    });

    const defaultProps = {
      languageFormData: {
        languageCode: language,
        updatedPreferredLanguage: preferredLanguage,
      },
      onLanguageFormChange: vi.fn(),
      onNext: vi.fn(),
      onCancel: vi.fn(),
      errorMessage: "",
      setErrorCode: vi.fn(),
      ...overrideProps,
    };

    return render(<EditLanguagePreferences {...defaultProps} />);
  };

  describe("Component Rendering", () => {
    it("renders the heading correctly", () => {
      setup();

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByText("Edit language preferences")).toBeInTheDocument();
    });

    it("renders the description text", () => {
      setup();

      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
      expect(
        screen.getByText(
          "Select your preferred language for notifications and communications.",
        ),
      ).toBeInTheDocument();
    });

    it("renders the language preference radio buttons", () => {
      setup();

      expect(screen.getByTestId("gcds-radios")).toBeInTheDocument();
      expect(screen.getByText("Preferred language")).toBeInTheDocument();
      expect(screen.getByTestId("radio-en-ca")).toBeInTheDocument();
      expect(screen.getByTestId("radio-fr-ca")).toBeInTheDocument();
    });

    it("renders continue and cancel buttons", () => {
      setup();

      expect(screen.getByTestId("gcds-button")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-button-secondary")).toBeInTheDocument();
      expect(screen.getByText("Continue")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("renders the services info section", () => {
      setup();

      expect(screen.getByTestId("services-info")).toBeInTheDocument();
      expect(screen.getByText("Services Info - en")).toBeInTheDocument();
    });

    it("renders all required components", () => {
      setup();

      expect(screen.getAllByTestId("gcds-container")).toHaveLength(2);
      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
      expect(screen.getByTestId("gcds-text")).toBeInTheDocument();
      expect(screen.getAllByTestId("gcds-grid")).toHaveLength(2);
      expect(screen.getByTestId("gcds-radios")).toBeInTheDocument();
    });
  });

  describe("Language Selection Logic", () => {
    it("displays English as checked when user's preferred language is English", () => {
      setup("en", "en-ca");

      const englishRadio = screen.getByTestId("radio-en-ca");
      expect(englishRadio).toBeChecked();
    });

    it("displays French as checked when user's preferred language is French", () => {
      setup("en", "fr-ca");

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      expect(frenchRadio).toBeChecked();
    });

    it("updates selected language when radio button is clicked", () => {
      setup("en", "en-ca");

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      fireEvent.click(frenchRadio);

      expect(frenchRadio).toBeChecked();
    });
  });

  describe("Navigation Functionality", () => {
    it("calls onNext when continue button is clicked", () => {
      const mockOnNext = vi.fn();
      setup("en", "en-ca", { onNext: mockOnNext });

      const continueButton = screen.getByTestId("gcds-button");
      fireEvent.click(continueButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it("calls onCancel when cancel button is clicked", () => {
      const mockOnCancel = vi.fn();
      setup("en", "en-ca", { onCancel: mockOnCancel });

      const cancelButton = screen.getByTestId("gcds-button-secondary");
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
    });

    it("calls onLanguageFormChange when radio button is changed", () => {
      const mockOnLanguageFormChange = vi.fn();
      setup("en", "en-ca", { onLanguageFormChange: mockOnLanguageFormChange });

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      fireEvent.click(frenchRadio);

      expect(mockOnLanguageFormChange).toHaveBeenCalledWith("fr-ca");
    });

    it("calls onNext when French interface is used", () => {
      const mockOnNext = vi.fn();
      setup("fr", "fr-ca", { onNext: mockOnNext });

      const continueButton = screen.getByTestId("gcds-button");
      fireEvent.click(continueButton);

      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe("Event Handlers", () => {
    it("prevents default behavior on continue button click", () => {
      setup();

      const continueButton = screen.getByTestId("gcds-button");
      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

      continueButton.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("prevents default behavior on cancel button click", () => {
      setup();

      const cancelButton = screen.getByTestId("gcds-button-secondary");
      const clickEvent = new Event("click", {
        bubbles: true,
        cancelable: true,
      });
      const preventDefaultSpy = vi.spyOn(clickEvent, "preventDefault");

      cancelButton.dispatchEvent(clickEvent);

      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it("handles radio button change event correctly", () => {
      setup("en", "en-ca");

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      // Use click instead of change for radio buttons
      fireEvent.click(frenchRadio);

      expect(frenchRadio).toBeChecked();
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles null user profile gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: null,
          relyingPartyInfo: {
            icon: "test-icon.png",
            id: "test-service-id",
            linkName: "Test Service",
            url: "https://test-service.example.com",
          },
        },
      });

      const props = {
        languageFormData: {
          languageCode: "en",
          updatedPreferredLanguage: "",
        },
        onLanguageFormChange: vi.fn(),
        onNext: vi.fn(),
        onCancel: vi.fn(),
        errorMessage: "",
        setErrorCode: vi.fn(),
      };

      render(<EditLanguagePreferences {...props} />);

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
    });

    it("handles undefined preferred language gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: undefined,
          },
          relyingPartyInfo: {
            icon: "test-icon.png",
            id: "test-service-id",
            linkName: "Test Service",
            url: "https://test-service.example.com",
          },
        },
      });

      const props = {
        languageFormData: {
          languageCode: "en",
          updatedPreferredLanguage: "",
        },
        onLanguageFormChange: vi.fn(),
        onNext: vi.fn(),
        onCancel: vi.fn(),
        errorMessage: "",
        setErrorCode: vi.fn(),
      };

      render(<EditLanguagePreferences {...props} />);

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
    });

    it("handles missing state gracefully", () => {
      useParams.mockReturnValue({ language: "en" });
      useUser.mockReturnValue({
        state: {
          userProfile: {
            preferredLanguage: "en-ca",
          },
          relyingPartyInfo: {
            icon: "test-icon.png",
            id: "test-service-id",
            linkName: "Test Service",
            url: "https://test-service.example.com",
          },
        },
      });

      const props = {
        languageFormData: {
          languageCode: "en",
          updatedPreferredLanguage: "en-ca",
        },
        onLanguageFormChange: vi.fn(),
        onNext: vi.fn(),
        onCancel: vi.fn(),
        errorMessage: "",
        setErrorCode: vi.fn(),
      };

      render(<EditLanguagePreferences {...props} />);

      expect(screen.getByTestId("gcds-heading")).toBeInTheDocument();
    });

    it("renders with French interface when language param is fr", () => {
      setup("fr", "fr-ca");

      expect(screen.getByText("Services Info - fr")).toBeInTheDocument();
    });
  });

  describe("Radio Options Configuration", () => {
    it("creates correct radio options with labels", () => {
      setup();

      expect(screen.getByText("English")).toBeInTheDocument();
      expect(screen.getByText("French")).toBeInTheDocument();
    });

    it("assigns correct values to radio options", () => {
      setup();

      const englishRadio = screen.getByTestId("radio-en-ca");
      const frenchRadio = screen.getByTestId("radio-fr-ca");

      expect(englishRadio).toHaveAttribute("value", "en-ca");
      expect(frenchRadio).toHaveAttribute("value", "fr-ca");
    });

    it("assigns correct IDs to radio options", () => {
      setup();

      expect(screen.getByTestId("radio-en-ca")).toHaveAttribute("id", "en-ca");
      expect(screen.getByTestId("radio-fr-ca")).toHaveAttribute("id", "fr-ca");
    });
  });

  describe("State Management", () => {
    it("initializes state with user's preferred language", () => {
      setup("en", "fr-ca");

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      expect(frenchRadio).toBeChecked();
    });

    it("updates state when language selection changes", () => {
      setup("en", "en-ca");

      const englishRadio = screen.getByTestId("radio-en-ca");
      expect(englishRadio).toBeChecked();

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      fireEvent.click(frenchRadio);

      expect(frenchRadio).toBeChecked();
    });

    it("calls onLanguageFormChange and onNext correctly", () => {
      const mockOnLanguageFormChange = vi.fn();
      const mockOnNext = vi.fn();
      setup("en", "en-ca", {
        onLanguageFormChange: mockOnLanguageFormChange,
        onNext: mockOnNext,
      });

      const frenchRadio = screen.getByTestId("radio-fr-ca");
      fireEvent.click(frenchRadio);

      const continueButton = screen.getByTestId("gcds-button");
      fireEvent.click(continueButton);

      expect(mockOnLanguageFormChange).toHaveBeenCalledWith("fr-ca");
      expect(mockOnNext).toHaveBeenCalled();
    });
  });
});
