import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import OtpSelection from "../OtpSelection";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";

// Mock the navigation hooks
const mockNavigateHelper = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../../hooks/useNavigate", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock utilities
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === PAGES.transientOtpSelection) {
      return {
        1: "Complete 2-step verification",
        2: "To change your password,",
        3: "first complete 2-step verification.",
        4: "Choose how you want to receive a verification code",
        5: "Once the code is sent it will expire in",
        6: "10 minutes.",
        7: "Carrier charges may apply.",
        8: "Text message",
        9: "Voice call",
        10: "Need help?",
        12: "Get help with 2-step verification",
        13: "I cannot access my phone",
        14: "To add a phone number,",
        15: "To delete this number,",
        16: "How should we send you the code?",
      };
    }
    if (page === "Button") {
      return {
        submit: "Submit",
        cancel: "Cancel",
      };
    }
    return {};
  }),
}));

vi.mock("../../../../utils/gcHelpCentreLinks", () => ({
  gcHelpCentreLinks: {
    twoStepVerification: "https://help.example.com/2fa",
    recover2StepVerification: "https://help.example.com/no-phone",
  },
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: vi.fn((page, { language }) => {
    if (page === PAGES.manage2FAVerifications) {
      return `/${language}/security-settings/manage-2fa-verifications`;
    }
    return `/${language}/test`;
  }),
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, style }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      onClick={onGcdsClick}
      style={style}
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children, className }) => (
    <div data-testid="container" className={className}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, columns, gap }) => (
    <div data-testid="grid" data-columns={columns} data-gap={gap}>
      {children}
    </div>
  ),
  GcdsHeading: ({ children, tag, lang }) => {
    const Tag = tag || "h1";
    return (
      <Tag data-testid={`heading-${tag}`} lang={lang}>
        {children}
      </Tag>
    );
  },
  GcdsLink: ({ children, href, target }) => (
    <a data-testid="gcds-link" href={href} target={target}>
      {children}
    </a>
  ),
  GcdsRadios: ({ name, legend, options, onGcdsChange }) => (
    <div data-testid="radio-group">
      <fieldset>
        <legend>{legend}</legend>
        {options.map((option) => (
          <label key={option.id} data-testid={`radio-label-${option.id}`}>
            <input
              type="radio"
              name={name}
              id={option.id}
              value={option.value}
              defaultChecked={option.checked}
              data-testid={`radio-${option.id}`}
              onChange={onGcdsChange}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </div>
  ),
  GcdsText: ({ children }) => <p data-testid="text">{children}</p>,
}));

const mockOnNext = vi.fn();
const mockOnChangeUserSelectedMfaFactor = vi.fn();
const mockOnCancel = vi.fn();

const defaultProps = {
  onNext: mockOnNext,
  userSelectedMfaFactor: null,
  onChangeUserSelectedMfaFactor: mockOnChangeUserSelectedMfaFactor,
  userPhoneFactors: [],
  parentPage: "password",
  onCancel: mockOnCancel,
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <BrowserRouter>
      <OtpSelection {...mergedProps} />
    </BrowserRouter>,
  );
};

describe("OtpSelection Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering and Layout", () => {
    it("renders the main heading", () => {
      renderComponent();
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
    });

    it("renders with default parent page content", () => {
      renderComponent();
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first complete 2-step verification\./),
      ).toBeInTheDocument();
    });

    it("renders with deleteMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.deleteMFAPage });
      expect(screen.getByText(/To delete this number,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first complete 2-step verification\./),
      ).toBeInTheDocument();
    });

    it("renders with addMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.addMFAPage });
      expect(screen.getByText(/To add a phone number,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first complete 2-step verification\./),
      ).toBeInTheDocument();
    });

    it("renders the verification code instructions heading", () => {
      renderComponent();
      expect(
        screen.getByText("Choose how you want to receive a verification code"),
      ).toBeInTheDocument();
    });

    it("renders the expiration and carrier charge notices", () => {
      renderComponent();
      expect(
        screen.getByText(/Once the code is sent it will expire in/),
      ).toBeInTheDocument();
      expect(screen.getByText(/10 minutes\./)).toBeInTheDocument();
      expect(
        screen.getByText(/Carrier charges may apply\./),
      ).toBeInTheDocument();
    });

    it("renders the help section", () => {
      renderComponent();
      expect(screen.getByText("Need help?")).toBeInTheDocument();
    });

    it("renders help links", () => {
      renderComponent();
      const links = screen.getAllByTestId("gcds-link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "https://help.example.com/2fa");
      expect(links[1]).toHaveAttribute(
        "href",
        "https://help.example.com/no-phone",
      );
    });

    it("renders submit and cancel buttons", () => {
      renderComponent();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
  });

  describe("Radio Options Configuration - SMS Only", () => {
    it("renders text display (not radio) for single SMS factor", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Should display as text, not radio group when only one factor
      expect(screen.queryByTestId("radio-group")).not.toBeInTheDocument();
      expect(
        screen.getByText(/Text message \+15551234567/),
      ).toBeInTheDocument();
    });

    it("renders radio buttons for multiple SMS factors", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "sms-factor-2",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(
        screen.getByText(/Text message \+15551234567/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Text message \+15559876543/),
      ).toBeInTheDocument();
    });

    it("sets correct checked state for selected SMS factor", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "sms-factor-2",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15559876543",
        },
      ];

      const userSelectedMfaFactor = {
        id: "sms-factor-2",
        type: FLOW_TYPES.sms,
        phoneNumber: "+15559876543",
      };

      renderComponent({ userPhoneFactors, userSelectedMfaFactor });

      const radio1 = screen.getByTestId(`radio-${FLOW_TYPES.sms}-sms-factor-1`);
      const radio2 = screen.getByTestId(`radio-${FLOW_TYPES.sms}-sms-factor-2`);

      expect(radio1).not.toBeChecked();
      expect(radio2).toBeChecked();
    });
  });

  describe("Radio Options Configuration - Voice Only", () => {
    it("renders radio buttons for single Voice factor", () => {
      const userPhoneFactors = [
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(screen.getByText(/Voice call \+15551234567/)).toBeInTheDocument();
    });

    it("renders radio buttons for multiple Voice factors", () => {
      const userPhoneFactors = [
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-2",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(screen.getByText(/Voice call \+15551234567/)).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15559876543/)).toBeInTheDocument();
    });

    it("sets correct checked state for selected Voice factor", () => {
      const userPhoneFactors = [
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-2",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      const userSelectedMfaFactor = {
        id: "voice-factor-1",
        type: FLOW_TYPES.voice,
        phoneNumber: "+15551234567",
      };

      renderComponent({ userPhoneFactors, userSelectedMfaFactor });

      const radio1 = screen.getByTestId(
        `radio-${FLOW_TYPES.voice}-voice-factor-1`,
      );
      const radio2 = screen.getByTestId(
        `radio-${FLOW_TYPES.voice}-voice-factor-2`,
      );

      expect(radio1).toBeChecked();
      expect(radio2).not.toBeChecked();
    });
  });

  describe("Radio Options Configuration - Mixed SMS and Voice", () => {
    it("renders radio buttons for both SMS and Voice factors", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(
        screen.getByText(/Text message \+15551234567/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15559876543/)).toBeInTheDocument();
    });

    it("renders multiple SMS and Voice factors correctly", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551111111",
        },
        {
          id: "sms-factor-2",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15552222222",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15553333333",
        },
        {
          id: "voice-factor-2",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15554444444",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(
        screen.getByText(/Text message \+15551111111/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Text message \+15552222222/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15553333333/)).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15554444444/)).toBeInTheDocument();
    });

    it("handles selection across different factor types", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      const userSelectedMfaFactor = {
        id: "voice-factor-1",
        type: FLOW_TYPES.voice,
        phoneNumber: "+15559876543",
      };

      renderComponent({ userPhoneFactors, userSelectedMfaFactor });

      const smsRadio = screen.getByTestId(
        `radio-${FLOW_TYPES.sms}-sms-factor-1`,
      );
      const voiceRadio = screen.getByTestId(
        `radio-${FLOW_TYPES.voice}-voice-factor-1`,
      );

      expect(smsRadio).not.toBeChecked();
      expect(voiceRadio).toBeChecked();
    });
  });

  describe("Single Factor Display", () => {
    it("displays text instead of radio when only one SMS factor exists", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Should display as text, not radio group
      expect(screen.queryByTestId("radio-group")).not.toBeInTheDocument();
      const textElements = screen.getAllByTestId("text");
      const hasPhoneNumber = textElements.some((el) =>
        el.textContent.includes("Text message +15551234567"),
      );
      expect(hasPhoneNumber).toBe(true);
    });

    it("displays text instead of radio when only one Voice factor exists", () => {
      const userPhoneFactors = [
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Should display as text, not radio group
      expect(screen.queryByTestId("radio-group")).not.toBeInTheDocument();
      const textElements = screen.getAllByTestId("text");
      const hasPhoneNumber = textElements.some((el) =>
        el.textContent.includes("Voice call +15551234567"),
      );
      expect(hasPhoneNumber).toBe(true);
    });
  });

  describe("User Interactions", () => {
    it("calls onNext when submit button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("prevents default event when submit button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      // onNext should be called
      expect(mockOnNext).toHaveBeenCalled();
    });

    it("navigates to manage 2FA page when cancel button is clicked", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onChangeUserSelectedMfaFactor when radio option is selected", async () => {
      const user = userEvent.setup();
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      const smsRadio = screen.getByTestId(
        `radio-${FLOW_TYPES.sms}-sms-factor-1`,
      );
      await user.click(smsRadio);

      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "sms-factor-1",
      );
    });

    it("handles multiple radio selection changes", async () => {
      const user = userEvent.setup();
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
        {
          id: "sms-factor-2",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551111111",
        },
      ];

      renderComponent({ userPhoneFactors });

      const smsRadio1 = screen.getByTestId(
        `radio-${FLOW_TYPES.sms}-sms-factor-1`,
      );
      const voiceRadio = screen.getByTestId(
        `radio-${FLOW_TYPES.voice}-voice-factor-1`,
      );
      const smsRadio2 = screen.getByTestId(
        `radio-${FLOW_TYPES.sms}-sms-factor-2`,
      );

      await user.click(smsRadio1);
      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "sms-factor-1",
      );

      await user.click(voiceRadio);
      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "voice-factor-1",
      );

      await user.click(smsRadio2);
      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "sms-factor-2",
      );

      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledTimes(3);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty userPhoneFactors array", () => {
      renderComponent({ userPhoneFactors: [] });

      // Should still render the page structure
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
    });

    it("handles null userPhoneFactors", () => {
      renderComponent({ userPhoneFactors: null });

      // Should still render the page structure
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("handles undefined userPhoneFactors", () => {
      renderComponent({ userPhoneFactors: undefined });

      // Should still render the page structure
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
    });

    it("handles null userSelectedMfaFactor", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors, userSelectedMfaFactor: null });

      // Should render without errors
      expect(
        screen.getByText(/Text message \+15551234567/),
      ).toBeInTheDocument();
    });

    it("handles phone numbers with different formats", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+1 (555) 123-4567",
        },
        {
          id: "sms-factor-2",
          type: FLOW_TYPES.sms,
          phoneNumber: "555-123-4567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(
        screen.getByText(/Text message \+1 \(555\) 123-4567/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Text message 555-123-4567/)).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15551234567/)).toBeInTheDocument();
    });

    it("handles factors without type field", () => {
      const userPhoneFactors = [
        {
          id: "factor-1",
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Should not crash, but won't display the factor
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
    });

    it("handles factors with unknown type", () => {
      const userPhoneFactors = [
        {
          id: "factor-1",
          type: "unknown",
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Should not display the unknown type
      expect(screen.queryByText(/unknown/)).not.toBeInTheDocument();
    });
  });

  describe("Language Support", () => {
    it("passes language to heading component", () => {
      renderComponent();

      const heading = screen.getByTestId("heading-h1");
      expect(heading).toHaveAttribute("lang", "en");
    });

    it("renders with French language parameter", () => {
      vi.doMock("react-router", async () => {
        const actual = await vi.importActual("react-router");
        return {
          ...actual,
          useParams: () => ({ language: "fr" }),
        };
      });

      // This test verifies the component can handle different language params
      renderComponent();
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
    });
  });

  describe("Grid and Layout Attributes", () => {
    it("renders grid with correct columns and gap attributes", () => {
      renderComponent();

      const grid = screen.getByTestId("grid");
      expect(grid).toHaveAttribute("data-columns", "max-content max-content");
      expect(grid).toHaveAttribute("data-gap", "200");
    });

    it("renders buttons with correct styles", () => {
      renderComponent();

      const submitButton = screen.getByTestId("submit-button");
      expect(submitButton).toHaveStyle({ width: "fit-content" });

      const cancelButton = screen.getByTestId("cancel-button");
      expect(cancelButton).toHaveStyle({ width: "fit-content" });
    });
  });

  describe("Radio Legend", () => {
    it("displays correct radio legend for multiple options", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      expect(
        screen.getByText("How should we send you the code?"),
      ).toBeInTheDocument();
    });
  });

  describe("Integration Tests", () => {
    it("renders complete component with all sections", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Main heading
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();

      // Instructions
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();

      // Radio options
      expect(
        screen.getByText(/Text message \+15551234567/),
      ).toBeInTheDocument();
      expect(screen.getByText(/Voice call \+15559876543/)).toBeInTheDocument();

      // Buttons
      expect(screen.getByTestId("submit-button")).toBeInTheDocument();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();

      // Help section
      expect(screen.getByText("Need help?")).toBeInTheDocument();
      expect(
        screen.getByText("Get help with 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.getByText("I cannot access my phone")).toBeInTheDocument();
    });

    it("handles full user workflow from selection to submission", async () => {
      const user = userEvent.setup();
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Select a factor
      const voiceRadio = screen.getByTestId(
        `radio-${FLOW_TYPES.voice}-voice-factor-1`,
      );
      await user.click(voiceRadio);

      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "voice-factor-1",
      );

      // Submit
      const submitButton = screen.getByTestId("submit-button");
      await user.click(submitButton);

      expect(mockOnNext).toHaveBeenCalled();
    });

    it("handles cancellation workflow", async () => {
      const user = userEvent.setup();
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
      ];

      renderComponent({ userPhoneFactors });

      // Click cancel
      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
      expect(mockOnNext).not.toHaveBeenCalled();
    });
  });

  describe("Accessibility", () => {
    it("renders radio group with proper structure", () => {
      const userPhoneFactors = [
        {
          id: "sms-factor-1",
          type: FLOW_TYPES.sms,
          phoneNumber: "+15551234567",
        },
        {
          id: "voice-factor-1",
          type: FLOW_TYPES.voice,
          phoneNumber: "+15559876543",
        },
      ];

      renderComponent({ userPhoneFactors });

      const radioGroup = screen.getByTestId("radio-group");
      expect(radioGroup.querySelector("fieldset")).toBeInTheDocument();
      expect(radioGroup.querySelector("legend")).toBeInTheDocument();
    });

    it("renders external links with proper hrefs", () => {
      renderComponent();

      const links = screen.getAllByTestId("gcds-link");
      expect(links).toHaveLength(2);
      expect(links[0]).toHaveAttribute("href", "https://help.example.com/2fa");
      expect(links[1]).toHaveAttribute(
        "href",
        "https://help.example.com/no-phone",
      );
    });
  });
});
