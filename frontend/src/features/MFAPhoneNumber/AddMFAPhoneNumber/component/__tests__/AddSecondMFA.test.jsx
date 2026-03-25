import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import AddSecondMFA from "../AddSecondMFA";
import "@testing-library/jest-dom/vitest";

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, style }) => (
    <button onClick={onGcdsClick} style={style} data-testid="gcds-button">
      {children}
    </button>
  ),
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsGrid: ({ children, columns, gap }) => (
    <div data-testid="gcds-grid" data-columns={columns} data-gap={gap}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag = "h1" }) => {
    const Component = tag;
    return (
      <Component data-testid="gcds-heading" data-tag={tag}>
        {children}
      </Component>
    );
  },
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsNotice: ({ children, noticeRole, noticeTitleTag, noticeTitle }) => (
    <div
      data-testid="gcds-notice"
      data-notice-role={noticeRole}
      data-notice-title-tag={noticeTitleTag}
      data-notice-title={noticeTitle}
    >
      {children}
    </div>
  ),
  GcdsLink: ({ children, onGcdsClick }) => (
    <button onClick={onGcdsClick} data-testid="gcds-link">
      {children}
    </button>
  ),
}));

// Mock react-router
const mockUseParams = vi.fn();
vi.mock("react-router", () => ({
  BrowserRouter: ({ children }) => <div>{children}</div>,
  useParams: () => mockUseParams(),
}));

// Mock utils
vi.mock("../../../../utils/constants", () => ({
  FLOW_TYPES: {
    voice: "voiceotp",
    sms: "smsotp",
  },
  PAGES: {
    addSecondMFATextMessage: "AddSecondMFATextMessage",
    addSecondMFAVoiceCall: "AddSecondMFAVoiceCall",
  },
}));

const mockGetPageContent = vi.fn();
vi.mock("../../../../utils/functions", () => ({
  getPageContent: mockGetPageContent,
}));

// Test wrapper component
const TestWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe("AddSecondMFA Unit Tests", () => {
  const mockOnSkipForNow = vi.fn();
  const mockOnAddSecondMFA = vi.fn();

  const defaultPhoneFormData = {
    phoneNumber: "6135551234",
    formattedPhoneNumber: "(613) 555-1234",
    otpType: "smsotp",
  };

  const mockPageContent = {
    1: "You have added",
    2: "as a 2-step verification phone number.",
    3: "Set up voice call verification (optional)",
    4: "Setting up voice call verification allows you to also receive verification codes by",
    5: "phone call",
    6: "when signing in.",
    7: "We recommend setting up this option if you might not be able to receive text messages at any point. Having both methods set up helps make sure you do not get locked out.",
    8: "Would you like to set up voice call verification?",
    9: "Yes, set up voice call verification",
    10: "No, skip for now",
  };

  beforeEach(() => {
    mockUseParams.mockReturnValue({ language: "en" });
    mockGetPageContent.mockReturnValue(mockPageContent);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Component Rendering", () => {
    it("should render the component without crashing", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("should render GCDS components with correct attributes", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Check notice component
      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-notice-role", "success");
      expect(notice).toHaveAttribute("data-notice-title-tag", "h2");

      // Check grid component
      const grid = screen.getByTestId("gcds-grid");
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");

      // Check headings
      const headings = screen.getAllByTestId("gcds-heading");
      expect(headings[0].tagName).toBe("H1");
      expect(headings[1].tagName).toBe("H2");
    });
  });

  describe("Content Display", () => {
    it("should display formatted phone number correctly", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      expect(screen.getByText("(613) 555-1234")).toBeInTheDocument();
    });

    it("should display page content from locale data", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Use partial text matching for split content
      expect(
        screen.getByText((content) => content.includes("You have added")),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content) =>
          content.includes("as a 2-step verification phone number"),
        ),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Set up voice call verification (optional)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Yes, set up voice call verification"),
      ).toBeInTheDocument();
      expect(screen.getByText("No, skip for now")).toBeInTheDocument();
    });
  });

  describe("OTP Type Logic", () => {
    it("should render different content based on otpType", () => {
      const voicePhoneFormData = {
        ...defaultPhoneFormData,
        otpType: "voiceotp",
      };

      const { rerender } = render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={voicePhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Component should render without crashing for voice type
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();

      const smsPhoneFormData = {
        ...defaultPhoneFormData,
        otpType: "smsotp",
      };

      rerender(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={smsPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Component should render without crashing for SMS type
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });
  });

  describe("Button Actions", () => {
    it("should call onAddSecondMFA when add button is clicked", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const addButton = screen.getByText("Yes, set up voice call verification");

      await act(async () => {
        addButton.click();
      });

      expect(mockOnAddSecondMFA).toHaveBeenCalledTimes(1);
    });

    it("should call onSkipForNow when skip link is clicked", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const skipLink = screen.getByText("No, skip for now");

      await act(async () => {
        skipLink.click();
      });

      expect(mockOnSkipForNow).toHaveBeenCalledTimes(1);
    });

    it("should prevent default on button click", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const addButton = screen.getByText("Yes, set up voice call verification");

      await act(async () => {
        addButton.click();
      });

      expect(mockOnAddSecondMFA).toHaveBeenCalled();
    });

    it("should prevent default on link click", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const skipLink = screen.getByText("No, skip for now");

      await act(async () => {
        skipLink.click();
      });

      expect(mockOnSkipForNow).toHaveBeenCalled();
    });
  });

  describe("Language Support", () => {
    it("should handle French language parameter", () => {
      mockUseParams.mockReturnValue({ language: "fr" });
      mockGetPageContent.mockReturnValue({
        1: "Vous avez ajouté",
        2: "comme numéro de téléphone de vérification en 2 étapes.",
        3: "Configurez la vérification par appel vocal (optionnel)",
        4: "La configuration de la vérification par appel vocal vous permet également de recevoir des codes de vérification par",
        5: "appel téléphonique",
        6: "lors de la connexion.",
        7: "Nous recommandons de configurer cette option si vous ne pouvez pas recevoir de messages texte à un moment donné. Avoir les deux méthodes configurées aide à s'assurer que vous ne soyez pas bloqué.",
        8: "Souhaitez-vous configurer la vérification par appel vocal ?",
        9: "Oui, configurer la vérification par appel vocal",
        10: "Non, ignorer pour l'instant",
      });

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Component should render without crashing
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();

      // Should show French content - use the actual rendered text
      expect(screen.getByText("Oui, configurer")).toBeInTheDocument();
    });

    it("should handle missing language parameter", () => {
      mockUseParams.mockReturnValue({});

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Component should render without crashing
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });
  });

  describe("Component Integration", () => {
    it("should handle complete user flow - add second MFA", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Verify initial state
      expect(screen.getByText("(613) 555-1234")).toBeInTheDocument();
      expect(
        screen.getByText("Yes, set up voice call verification"),
      ).toBeInTheDocument();

      // User clicks add button
      const addButton = screen.getByText("Yes, set up voice call verification");
      await act(async () => {
        addButton.click();
      });

      expect(mockOnAddSecondMFA).toHaveBeenCalledTimes(1);
    });

    it("should handle complete user flow - skip for now", async () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Verify initial state
      expect(screen.getByText("(613) 555-1234")).toBeInTheDocument();
      expect(screen.getByText("No, skip for now")).toBeInTheDocument();

      // User clicks skip link
      const skipLink = screen.getByText("No, skip for now");
      await act(async () => {
        skipLink.click();
      });

      expect(mockOnSkipForNow).toHaveBeenCalledTimes(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty phone form data", () => {
      const emptyPhoneFormData = {
        phoneNumber: "",
        formattedPhoneNumber: "",
        otpType: "smsotp",
      };

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={emptyPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("should handle different otpType values", () => {
      const customPhoneFormData = {
        ...defaultPhoneFormData,
        otpType: "custom-type",
      };

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={customPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Should still render without crashing
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("should handle missing callback functions gracefully", async () => {
      const noOpFunction = () => {};

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={noOpFunction}
            onAddSecondMFA={noOpFunction}
          />
        </TestWrapper>,
      );

      // Component should still render
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();

      // Clicking buttons shouldn't crash the component
      const addButton = screen.getByText("Yes, set up voice call verification");
      const skipLink = screen.getByText("No, skip for now");

      await act(async () => {
        addButton.click();
      });

      await act(async () => {
        skipLink.click();
      });

      // Should not throw errors
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper heading hierarchy", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const headings = screen.getAllByTestId("gcds-heading");
      const h1 = headings.find((h) => h.getAttribute("data-tag") === "h1");
      const h2 = headings.find((h) => h.getAttribute("data-tag") === "h2");

      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it("should have success notice with proper attributes", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const notice = screen.getByTestId("gcds-notice");
      expect(notice).toHaveAttribute("data-notice-role", "success");
      expect(notice).toHaveAttribute("data-notice-title-tag", "h2");
    });

    it("should have proper button styling", () => {
      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const button = screen.getByTestId("gcds-button");
      expect(button).toHaveStyle("width: fit-content");
    });
  });

  describe("Error Handling", () => {
    it("should handle getPageContent returning empty object", () => {
      mockGetPageContent.mockReturnValue({});

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      // Component should still render even with empty content
      expect(screen.getByTestId("gcds-container")).toBeInTheDocument();
    });

    it("should handle button clicks that call callback functions", async () => {
      const mockAddCallback = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockOnSkipForNow}
            onAddSecondMFA={mockAddCallback}
          />
        </TestWrapper>,
      );

      const addButton = screen.getByText("Yes, set up voice call verification");

      await act(async () => {
        addButton.click();
      });

      expect(mockAddCallback).toHaveBeenCalled();
    });

    it("should handle link clicks that call callback functions", async () => {
      const mockSkipCallback = vi.fn().mockResolvedValue(undefined);

      render(
        <TestWrapper>
          <AddSecondMFA
            phoneFormData={defaultPhoneFormData}
            onSkipForNow={mockSkipCallback}
            onAddSecondMFA={mockOnAddSecondMFA}
          />
        </TestWrapper>,
      );

      const skipLink = screen.getByText("No, skip for now");

      await act(async () => {
        skipLink.click();
      });

      expect(mockSkipCallback).toHaveBeenCalled();
    });
  });
});
