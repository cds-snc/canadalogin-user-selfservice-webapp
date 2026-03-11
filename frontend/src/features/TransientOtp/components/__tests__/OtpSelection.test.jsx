import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import userEvent from "@testing-library/user-event";
import OtpSelection from "../OtpSelection";
import { FLOW_TYPES, PAGES } from "../../../../utils/constants";

// ---------------------------------------------------------------------------
// Router / navigate mocks
// ---------------------------------------------------------------------------
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
  };
});

vi.mock("../../../../hooks/useNavigate.js", () => ({
  useNavigateHelper: () => vi.fn(),
}));

// ---------------------------------------------------------------------------
// Utility mocks
// ---------------------------------------------------------------------------
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === PAGES.transientOtpSelection) {
      return {
        1: "Complete 2-step verification",
        2: "To change your password,",
        3: "first complete 2-step verification.",
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
        17: "Passkey or security key",
        18: "Select SMS",
        19: "Select voice",
        20: "Use passkey",
        21: "How do you want to verify?",
        22: "To delete this passkey,",
        23: "To add a passkey,",
      };
    }
    if (page === "Button") {
      return {
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
  path: vi.fn((page, { language }) => `/${language}/test`),
}));

// ---------------------------------------------------------------------------
// GCDS component mocks
// ---------------------------------------------------------------------------
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, buttonRole, style }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "cancel-button" : "submit-button"
      }
      data-role={buttonRole}
      onClick={onGcdsClick}
      style={style}
    >
      {children}
    </button>
  ),
  GcdsContainer: ({ children, className, role }) => (
    <div className={className} role={role}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children, columns }) => (
    <div data-testid="grid" data-columns={columns}>
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
  // Differentiate external links (href) from button-style links (onGcdsClick)
  GcdsLink: ({ children, href, target, onGcdsClick }) => {
    if (href) {
      return (
        <a data-testid="gcds-link-external" href={href} target={target}>
          {children}
        </a>
      );
    }
    return (
      <button data-testid="gcds-link-button" onClick={onGcdsClick}>
        {children}
      </button>
    );
  },
  GcdsText: ({ children }) => <p data-testid="gcds-text">{children}</p>,
}));

// ---------------------------------------------------------------------------
// Default props / helpers
// ---------------------------------------------------------------------------
const mockOnNext = vi.fn();
const mockOnChangeUserSelectedMfaFactor = vi.fn();
const mockOnCancel = vi.fn();
const mockOnSelectFIDO2 = vi.fn();

const defaultProps = {
  onNext: mockOnNext,
  onChangeUserSelectedMfaFactor: mockOnChangeUserSelectedMfaFactor,
  userPhoneFactors: [],
  fido2Data: [],
  parentPage: "password",
  onCancel: mockOnCancel,
  onSelectFIDO2: mockOnSelectFIDO2,
};

const renderComponent = (props = {}) => {
  const mergedProps = { ...defaultProps, ...props };
  return render(
    <BrowserRouter>
      <OtpSelection {...mergedProps} />
    </BrowserRouter>,
  );
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("OtpSelection Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe("Rendering and Layout", () => {
    it("renders the main heading", () => {
      renderComponent();
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
    });

    it("renders the 'how to verify' section heading", () => {
      renderComponent();
      expect(
        screen.getByText("How do you want to verify?"),
      ).toBeInTheDocument();
    });

    it("renders the 'Need help?' section heading", () => {
      renderComponent();
      expect(screen.getByText("Need help?")).toBeInTheDocument();
    });

    it("renders help links with correct hrefs", () => {
      renderComponent();
      const links = screen.getAllByTestId("gcds-link-external");
      expect(links).toHaveLength(1);
      expect(links[0]).toHaveAttribute("href", "https://help.example.com/2fa");
    });

    it("renders help link labels", () => {
      renderComponent();
      expect(
        screen.getByText("Get help with 2-step verification"),
      ).toBeInTheDocument();
    });

    it("renders the cancel button", () => {
      renderComponent();
      expect(screen.getByTestId("cancel-button")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });

    it("does NOT render a submit button", () => {
      renderComponent();
      expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument();
    });

    it("passes language attribute to the h1 heading", () => {
      renderComponent();
      const h1 = screen.getByTestId("heading-h1");
      expect(h1).toHaveAttribute("lang", "en");
    });
  });

  // -------------------------------------------------------------------------
  describe("Parent page content variations", () => {
    it("renders default (password) parent page content", () => {
      renderComponent({ parentPage: "password" });
      expect(screen.getByText(/To change your password,/)).toBeInTheDocument();
      expect(
        screen.getByText(/first complete 2-step verification./),
      ).toBeInTheDocument();
    });

    it("renders deleteMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.deleteMFAPage });
      expect(screen.getByText(/To delete this number,/)).toBeInTheDocument();
    });

    it("renders addMFAPage parent page content", () => {
      renderComponent({ parentPage: PAGES.addMFAPage });
      expect(screen.getByText(/To add a phone number,/)).toBeInTheDocument();
    });

    it("renders deleteFIDO2PasskeyPage parent page content", () => {
      renderComponent({ parentPage: PAGES.deleteFIDO2PasskeyPage });
      expect(screen.getByText(/To delete this passkey,/)).toBeInTheDocument();
    });

    it("renders addFIDO2PasskeyPage parent page content", () => {
      renderComponent({ parentPage: PAGES.addFIDO2PasskeyPage });
      expect(screen.getByText(/To add a passkey,/)).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe("SMS Section", () => {
    it("does not render SMS section when there are no SMS factors", () => {
      renderComponent({ userPhoneFactors: [] });
      expect(screen.queryByText("Text message")).not.toBeInTheDocument();
    });

    it("renders SMS section heading when an SMS factor is present", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551234567" },
        ],
      });
      expect(screen.getByText("Text message")).toBeInTheDocument();
    });

    it("renders the SMS factor destination", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551234567" },
        ],
      });
      expect(screen.getByText("+15551234567")).toBeInTheDocument();
    });

    it("renders a select link for each SMS factor", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551111111" },
          { id: "sms-2", type: FLOW_TYPES.sms, destination: "+15552222222" },
        ],
      });
      const selectLinks = screen.getAllByText("Select SMS");
      expect(selectLinks).toHaveLength(2);
    });

    it("renders expiry and carrier charge text inside the SMS section", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551234567" },
        ],
      });
      expect(
        screen.getByText(/Once the code is sent it will expire in/),
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Carrier charges may apply./),
      ).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe("Voice Section", () => {
    it("does not render Voice section when there are no voice factors", () => {
      renderComponent({ userPhoneFactors: [] });
      expect(screen.queryByText("Voice call")).not.toBeInTheDocument();
    });

    it("renders Voice section heading when a voice factor is present", () => {
      renderComponent({
        userPhoneFactors: [
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15559876543",
          },
        ],
      });
      expect(screen.getByText("Voice call")).toBeInTheDocument();
    });

    it("renders the voice factor destination", () => {
      renderComponent({
        userPhoneFactors: [
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15559876543",
          },
        ],
      });
      expect(screen.getByText("+15559876543")).toBeInTheDocument();
    });

    it("renders a select link for each voice factor", () => {
      renderComponent({
        userPhoneFactors: [
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15551111111",
          },
          {
            id: "voice-2",
            type: FLOW_TYPES.voice,
            destination: "+15552222222",
          },
        ],
      });
      const selectLinks = screen.getAllByText("Select voice");
      expect(selectLinks).toHaveLength(2);
    });

    it("renders both SMS and Voice sections when both types are present", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551111111" },
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15552222222",
          },
        ],
      });
      expect(screen.getByText("Text message")).toBeInTheDocument();
      expect(screen.getByText("Voice call")).toBeInTheDocument();
      expect(screen.getByText("+15551111111")).toBeInTheDocument();
      expect(screen.getByText("+15552222222")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  describe("FIDO2 / Passkey Section", () => {
    it("does not render FIDO2 section when fido2Data is an empty array", () => {
      renderComponent({ fido2Data: [] });
      expect(
        screen.queryByText("Passkey or security key"),
      ).not.toBeInTheDocument();
    });

    it("does not render FIDO2 section when fido2Data is null", () => {
      renderComponent({ fido2Data: null });
      expect(
        screen.queryByText("Passkey or security key"),
      ).not.toBeInTheDocument();
    });

    it("does not render FIDO2 section when fido2Data is undefined", () => {
      renderComponent({ fido2Data: undefined });
      expect(
        screen.queryByText("Passkey or security key"),
      ).not.toBeInTheDocument();
    });

    it("renders FIDO2 section heading when passkeys are present", () => {
      renderComponent({
        fido2Data: [{ id: "passkey-1", attributes: { nickname: "My Key" } }],
      });
      expect(screen.getByText("Passkey or security key")).toBeInTheDocument();
    });

    it("renders passkey nickname when available", () => {
      renderComponent({
        fido2Data: [
          { id: "passkey-1", attributes: { nickname: "Work Laptop Key" } },
        ],
      });
      expect(screen.getByText("Work Laptop Key")).toBeInTheDocument();
    });

    it("renders passkey id when nickname is not available", () => {
      renderComponent({
        fido2Data: [{ id: "passkey-id-no-nickname", attributes: {} }],
      });
      expect(screen.getByText("passkey-id-no-nickname")).toBeInTheDocument();
    });

    it("renders passkey id when attributes object is missing", () => {
      renderComponent({
        fido2Data: [{ id: "passkey-no-attrs" }],
      });
      expect(screen.getByText("passkey-no-attrs")).toBeInTheDocument();
    });

    it("renders a select link for each passkey", () => {
      renderComponent({
        fido2Data: [
          { id: "passkey-1", attributes: { nickname: "Key One" } },
          { id: "passkey-2", attributes: { nickname: "Key Two" } },
        ],
      });
      const passkeyLinks = screen.getAllByText("Use passkey");
      expect(passkeyLinks).toHaveLength(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("User Interactions", () => {
    it("clicking an SMS factor link calls onChangeUserSelectedMfaFactor with its id", async () => {
      const user = userEvent.setup();
      renderComponent({
        userPhoneFactors: [
          {
            id: "sms-factor-1",
            type: FLOW_TYPES.sms,
            destination: "+15551234567",
          },
        ],
      });

      const selectLink = screen.getByText("Select SMS");
      await user.click(selectLink);

      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "sms-factor-1",
      );
    });

    it("clicking an SMS factor link also calls onNext", async () => {
      const user = userEvent.setup();
      renderComponent({
        userPhoneFactors: [
          {
            id: "sms-factor-1",
            type: FLOW_TYPES.sms,
            destination: "+15551234567",
          },
        ],
      });

      const selectLink = screen.getByText("Select SMS");
      await user.click(selectLink);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("clicking a voice factor link calls onChangeUserSelectedMfaFactor with its id", async () => {
      const user = userEvent.setup();
      renderComponent({
        userPhoneFactors: [
          {
            id: "voice-factor-1",
            type: FLOW_TYPES.voice,
            destination: "+15559876543",
          },
        ],
      });

      const selectLink = screen.getByText("Select voice");
      await user.click(selectLink);

      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith(
        "voice-factor-1",
      );
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it("clicking a FIDO2 passkey link calls onSelectFIDO2 with the full passkey object", async () => {
      const user = userEvent.setup();
      const passkey = { id: "passkey-1", attributes: { nickname: "My Key" } };
      renderComponent({ fido2Data: [passkey] });

      const selectLink = screen.getByText("Use passkey");
      await user.click(selectLink);

      expect(mockOnSelectFIDO2).toHaveBeenCalledWith(passkey);
    });

    it("clicking the cancel button calls onCancel", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it("clicking the cancel button does NOT call onNext", async () => {
      const user = userEvent.setup();
      renderComponent();

      const cancelButton = screen.getByTestId("cancel-button");
      await user.click(cancelButton);

      expect(mockOnNext).not.toHaveBeenCalled();
    });

    it("selecting different SMS factors calls onChangeUserSelectedMfaFactor with the correct id each time", async () => {
      const user = userEvent.setup();
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551111111" },
          { id: "sms-2", type: FLOW_TYPES.sms, destination: "+15552222222" },
        ],
      });

      const selectLinks = screen.getAllByText("Select SMS");
      await user.click(selectLinks[0]);
      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith("sms-1");

      await user.click(selectLinks[1]);
      expect(mockOnChangeUserSelectedMfaFactor).toHaveBeenCalledWith("sms-2");

      expect(mockOnNext).toHaveBeenCalledTimes(2);
    });
  });

  // -------------------------------------------------------------------------
  describe("Edge Cases", () => {
    it("renders core layout even with no phone factors and no passkeys", () => {
      renderComponent({ userPhoneFactors: [], fido2Data: [] });

      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
      expect(screen.getByText("Need help?")).toBeInTheDocument();
    });

    it("handles null userPhoneFactors without crashing", () => {
      renderComponent({ userPhoneFactors: null });
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
      expect(screen.queryByText("Text message")).not.toBeInTheDocument();
      expect(screen.queryByText("Voice call")).not.toBeInTheDocument();
    });

    it("handles undefined userPhoneFactors without crashing", () => {
      renderComponent({ userPhoneFactors: undefined });
      expect(
        screen.getByText("Complete 2-step verification"),
      ).toBeInTheDocument();
    });

    it("renders all three sections when SMS, Voice, and FIDO2 factors are present", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551111111" },
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15552222222",
          },
        ],
        fido2Data: [{ id: "passkey-1", attributes: { nickname: "My Key" } }],
      });

      expect(screen.getByText("Text message")).toBeInTheDocument();
      expect(screen.getByText("Voice call")).toBeInTheDocument();
      expect(screen.getByText("Passkey or security key")).toBeInTheDocument();
    });

    it("does not crash when onSelectFIDO2 is not provided and a passkey link is clicked", async () => {
      const user = userEvent.setup();
      renderComponent({
        fido2Data: [{ id: "passkey-1", attributes: { nickname: "My Key" } }],
        onSelectFIDO2: undefined,
      });

      const selectLink = screen.getByText("Use passkey");
      await expect(user.click(selectLink)).resolves.not.toThrow();
    });
  });
});
