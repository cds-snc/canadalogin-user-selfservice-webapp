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

vi.mock("../../../../utils/routeHelpers", () => ({
  path: vi.fn((page, { language }) => `/${language}/test`),
}));

// ---------------------------------------------------------------------------
// GCDS component mocks
// ---------------------------------------------------------------------------
vi.mock("@gcds-core/components-react", () => ({
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
  GcdsLink: ({ children, href, target, onGcdsClick, ...rest }) => {
    if (href) {
      return (
        <a
          data-testid="gcds-link-external"
          href={href}
          target={target}
          {...rest}
        >
          {children}
        </a>
      );
    }
    return (
      <button data-testid="gcds-link-button" onClick={onGcdsClick} {...rest}>
        {children}
      </button>
    );
  },
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
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
        screen.getByText("Choose how you want to verify"),
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
      expect(links[0]).toHaveAttribute(
        "href",
        "https://login.canada.ca/en/users/get-started/two-step-verification-methods/",
      );
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
      expect(
        screen.getByText(/To delete a passkey or security key,/),
      ).toBeInTheDocument();
    });

    it("renders addFIDO2PasskeyPage parent page content", () => {
      renderComponent({ parentPage: PAGES.addFIDO2PasskeyPage });
      expect(
        screen.getByText(/To add a passkey or security key,/),
      ).toBeInTheDocument();
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
      expect(screen.getByText("******-4567")).toBeInTheDocument();
    });

    it("adds a screen-reader label for SMS actions using the last four digits", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551234567" },
        ],
      });

      expect(screen.getByText("Text me")).toHaveAttribute(
        "aria-label",
        "Text me at number ending in 4567",
      );
    });

    it("renders a select link for each SMS factor", () => {
      renderComponent({
        userPhoneFactors: [
          { id: "sms-1", type: FLOW_TYPES.sms, destination: "+15551111111" },
          { id: "sms-2", type: FLOW_TYPES.sms, destination: "+15552222222" },
        ],
      });
      const selectLinks = screen.getAllByText("Text me");
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
      expect(screen.getByText("******-6543")).toBeInTheDocument();
    });

    it("adds a screen-reader label for voice actions using the last four digits", () => {
      renderComponent({
        userPhoneFactors: [
          {
            id: "voice-1",
            type: FLOW_TYPES.voice,
            destination: "+15559876543",
          },
        ],
      });

      expect(screen.getByText("Call me")).toHaveAttribute(
        "aria-label",
        "Call me at number ending in 6543",
      );
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
      const selectLinks = screen.getAllByText("Call me");
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
      expect(screen.getByText("******-1111")).toBeInTheDocument();
      expect(screen.getByText("******-2222")).toBeInTheDocument();
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

    it("adds a screen-reader label for passkey verification actions", () => {
      renderComponent({
        fido2Data: [{ id: "passkey-1", attributes: { nickname: "1Password" } }],
      });

      expect(screen.getByText("Verify")).toHaveAttribute(
        "aria-label",
        "Verify with 1Password passkey",
      );
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
      const passkeyLinks = screen.getAllByText("Verify");
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

      const selectLink = screen.getByText("Text me");
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

      const selectLink = screen.getByText("Text me");
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

      const selectLink = screen.getByText("Call me");
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

      const selectLink = screen.getByText("Verify");
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

      const selectLinks = screen.getAllByText("Text me");
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

      const selectLink = screen.getByText("Verify");
      await expect(user.click(selectLink)).resolves.not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  describe("Email Section", () => {
    it("does not render email section when emailAddress is not provided", () => {
      renderComponent({ onSelectEmail: vi.fn() });
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
      expect(screen.queryByText("Email me")).not.toBeInTheDocument();
    });

    it("does not render email section when onSelectEmail is not provided", () => {
      renderComponent({ emailAddress: "user@example.com" });
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
      expect(screen.queryByText("Email me")).not.toBeInTheDocument();
    });

    it("renders email section when both emailAddress and onSelectEmail are provided", () => {
      renderComponent({
        emailAddress: "user@example.com",
        onSelectEmail: vi.fn(),
      });
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(screen.getByText("Email me")).toBeInTheDocument();
    });

    it("renders the email address in the email section", () => {
      renderComponent({
        emailAddress: "user@example.com",
        onSelectEmail: vi.fn(),
      });
      expect(screen.getByText("user@example.com")).toBeInTheDocument();
    });

    it("calls onSelectEmail when 'Email me' link is clicked", async () => {
      const user = userEvent.setup();
      const mockOnSelectEmail = vi.fn();
      renderComponent({
        emailAddress: "user@example.com",
        onSelectEmail: mockOnSelectEmail,
      });

      const emailLink = screen.getByText("Email me");
      await user.click(emailLink);

      expect(mockOnSelectEmail).toHaveBeenCalledTimes(1);
    });

    it("renders all four sections when SMS, Voice, FIDO2, and email are present", () => {
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
        emailAddress: "user@example.com",
        onSelectEmail: vi.fn(),
      });

      expect(screen.getByText("Text message")).toBeInTheDocument();
      expect(screen.getByText("Voice call")).toBeInTheDocument();
      expect(screen.getByText("Passkey or security key")).toBeInTheDocument();
      expect(screen.getByText("Email")).toBeInTheDocument();
    });

    it("does not render email section when emailAddress is null", () => {
      renderComponent({ emailAddress: null, onSelectEmail: vi.fn() });
      expect(screen.queryByText("Email")).not.toBeInTheDocument();
    });
  });
});
