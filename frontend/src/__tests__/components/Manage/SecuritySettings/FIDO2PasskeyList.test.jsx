/**
 * Unit tests for FIDO2PasskeyList component
 *
 * Tests verify component behavior:
 * - Rendering with empty data
 * - Rendering single and multiple passkey items
 * - Displaying nickname and created-on date (date only, no time)
 * - Navigation on Rename and Delete button clicks
 */
import { render, screen, waitFor, act } from "@testing-library/react";
import { fido2Api } from "../../../../features/ManageFIDO2/api/fido2Api";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import FIDO2PasskeyList from "../../../../components/Manage/SecuritySettings/components/FIDO2PasskeyList";
import { GA_FORM_EVENTS } from "../../../../utils/analyticsConstants";

const mockTrackEvent = vi.fn();
const mockTrackPage = vi.fn();

const mockNavigate = vi.fn();
const mockPathname = "/en/manage-security-verifications";
const mockRpParams = {
  rp_name: "Test RP",
  rp_client_id: "test-rp-client-id",
};
const renamePasskeyStep = "rename_passkey";
const renamePasskeyPageIds = {
  edit: "RenamePasskeyEdit",
  success: "RenamePasskeySuccess",
};

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: mockPathname }),
}));

vi.mock("../../../../features/ManageFIDO2/api/fido2Api", () => ({
  fido2Api: {
    updateRegistration: vi.fn(),
  },
}));

vi.mock("../../../../hooks/useFormTracking", () => ({
  useFormTracking: () => ({ trackEvent: mockTrackEvent }),
}));

vi.mock("../../../../hooks/useRelyingPartyAnalyticsParams", () => ({
  useRelyingPartyAnalyticsParams: () => mockRpParams,
}));

vi.mock("../../../../utils/gatag", () => ({
  trackPage: (...args) => mockTrackPage(...args),
}));

vi.mock("../../../../utils/functions", () => ({
  getPageContent: () => ({
    13: "Delete",
    14: "Rename",
    16: "Created on ",
    22: "Save",
    error_rename_credential: "Error renaming credential",
  }),
}));

vi.mock("../../../../utils/constants", () => ({
  PAGES: {
    manage2FAVerifications: "Manage2FAVerifications",
    deleteFIDO2PasskeyPage: "deleteFIDO2PasskeyPage",
    renameFIDO2PasskeyPage: "renameFIDO2PasskeyPage",
  },
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: (_page, { language } = {}) => `/${language}/mock-path`,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const messages = {
        "Manage2FAVerifications.createdOn": "Created on ",
        "Manage2FAVerifications.renamePasskey": "Rename",
        "Manage2FAVerifications.deletePasskey": "Delete",
        "Manage2FAVerifications.saveButton": "Save",
        "Manage2FAVerifications.cancelButton": "Cancel",
        "Manage2FAVerifications.nameLabel": "Passkey name",
        "Manage2FAVerifications.renamePasskeyInfoTitle": "Information",
        "Manage2FAVerifications.renamePasskeyInfoDescription":
          "Renaming a passkey will send a notification to your email address",
      };

      return messages[key] ?? key;
    },
  }),
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsNotice: ({ children, noticeTitle }) => (
    <div data-testid="rename-passkey-notice" data-notice-title={noticeTitle}>
      {children}
    </div>
  ),
  GcdsGrid: ({ children }) => <div data-testid="gcds-grid">{children}</div>,
  GcdsSrOnly: () => null,
  GcdsButton: ({ children, onGcdsClick, onClick, id, disabled }) => (
    <button
      data-testid={id}
      onClick={onGcdsClick ?? onClick}
      disabled={disabled}
    >
      {children}
    </button>
  ),
  GcdsInput: ({ inputId, value, onInput, errorMessage }) => (
    <>
      <input data-testid={inputId} value={value ?? ""} onChange={onInput} />
      {errorMessage && (
        <span data-testid={`${inputId}-error`}>{errorMessage}</span>
      )}
    </>
  ),
}));

const makeCredential = (overrides = {}) => ({
  id: "cred-1",
  attributes: { nickname: "My Passkey" },
  created: "2026-02-25T12:33:26.000Z",
  ...overrides,
});

describe("FIDO2PasskeyList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders nothing when given an empty array", () => {
    const { container } = render(
      <FIDO2PasskeyList userFIDO2CredentialsData={[]} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders a passkey item with the nickname", () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[makeCredential()]} />);
    expect(screen.getByText("My Passkey")).toBeInTheDocument();
  });

  it("displays the created-on date without time", () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[makeCredential()]} />);
    const expectedDate = new Date(
      "2026-02-25T12:33:26.000Z",
    ).toLocaleDateString();
    expect(screen.getByText(`Created on ${expectedDate}`)).toBeInTheDocument();
  });

  it("does not display time in the created-on text", () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[makeCredential()]} />);
    // Time portion should not appear – toLocaleDateString never produces a colon-separated time
    expect(screen.queryByText(/\d{1,2}:\d{2}/)).not.toBeInTheDocument();
  });

  it("renders Rename and Delete buttons", () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[makeCredential()]} />);
    expect(screen.getByTestId("rename-fido2-button")).toHaveTextContent(
      "Rename",
    );
    expect(screen.getByTestId("delete-fido2-button")).toHaveTextContent(
      "Delete",
    );
  });

  it("renders multiple passkey items", () => {
    const credentials = [
      makeCredential({ id: "cred-1", attributes: { nickname: "Passkey One" } }),
      makeCredential({ id: "cred-2", attributes: { nickname: "Passkey Two" } }),
      makeCredential({
        id: "cred-3",
        attributes: { nickname: "Passkey Three" },
      }),
    ];
    render(<FIDO2PasskeyList userFIDO2CredentialsData={credentials} />);
    expect(screen.getByText("Passkey One")).toBeInTheDocument();
    expect(screen.getByText("Passkey Two")).toBeInTheDocument();
    expect(screen.getByText("Passkey Three")).toBeInTheDocument();
  });

  it("shows inline edit field when Rename is clicked", async () => {
    const credential = makeCredential({
      id: "cred-1",
      attributes: { nickname: "My Key" },
    });
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await userEvent.click(screen.getByTestId("rename-fido2-button"));

    // Should show inline input pre-populated with the nickname
    expect(screen.getByTestId("passkeyNickname")).toBeInTheDocument();
    // The rename button should be replaced by a save button
    expect(screen.queryByTestId("rename-fido2-button")).not.toBeInTheDocument();
    // Should NOT navigate to a separate page
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_STEP_START,
      step: renamePasskeyStep,
    });
    expect(mockTrackPage).toHaveBeenCalledWith(
      mockPathname,
      renamePasskeyPageIds.edit,
      mockRpParams,
    );
  });

  it("shows rename info notice only while editing", async () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[makeCredential()]} />);

    expect(
      screen.queryByTestId("rename-passkey-notice"),
    ).not.toBeInTheDocument();

    await userEvent.click(screen.getByTestId("rename-fido2-button"));

    const notice = screen.getByTestId("rename-passkey-notice");
    expect(notice).toBeInTheDocument();
    expect(notice).toHaveAttribute("data-notice-title", "Information");
    expect(notice).toHaveTextContent(
      "Renaming a passkey will send a notification to your email address",
    );
  });

  it("navigates to the delete page when Delete is clicked", async () => {
    const credential = makeCredential({
      id: "cred-1",
      attributes: { nickname: "My Key" },
    });
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await userEvent.click(screen.getByTestId("delete-fido2-button"));

    expect(mockNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path", {
      state: { passkeyId: "cred-1", passkeyNickname: "My Key" },
    });
  });

  it("hides Delete when the passkey is the last remaining 2FA factor", () => {
    const credential = makeCredential({
      id: "cred-1",
      attributes: { nickname: "My Key" },
    });

    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        totalFactorCount={1}
      />,
    );

    expect(screen.queryByTestId("delete-fido2-button")).not.toBeInTheDocument();
  });

  it("keeps Delete enabled when another 2FA factor remains", () => {
    const credential = makeCredential({
      id: "cred-1",
      attributes: { nickname: "My Key" },
    });

    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        totalFactorCount={2}
      />,
    );

    expect(screen.getByTestId("delete-fido2-button")).toBeEnabled();
  });

  it("renders a separator for each passkey item", () => {
    const credentials = [
      makeCredential({ id: "cred-1" }),
      makeCredential({ id: "cred-2" }),
    ];
    const { container } = render(
      <FIDO2PasskeyList userFIDO2CredentialsData={credentials} />,
    );
    const separators = container.querySelectorAll(".separator");
    expect(separators).toHaveLength(2);
  });

  it("renders outer and content containers for each passkey item", () => {
    const credentials = [
      makeCredential({ id: "cred-1" }),
      makeCredential({ id: "cred-2" }),
    ];
    render(<FIDO2PasskeyList userFIDO2CredentialsData={credentials} />);
    expect(screen.getAllByTestId("gcds-container")).toHaveLength(4);
  });
});

describe("FIDO2PasskeyList — inline rename (Save) flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fido2Api.updateRegistration).mockResolvedValue({ success: true });
  });

  const credential = makeCredential({
    id: "cred-1",
    attributes: { nickname: "My Key" },
  });

  it("pre-populates the input with the current nickname when editing starts", async () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    expect(screen.getByTestId("passkeyNickname")).toHaveValue("My Key");
  });

  it("updates the input value as the user types", async () => {
    const user = userEvent.setup();
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await user.click(screen.getByTestId("rename-fido2-button"));
    const input = screen.getByTestId("passkeyNickname");
    await user.clear(input);
    await user.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("calls fido2Api.updateRegistration with the passkey id and nickname", async () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(fido2Api.updateRegistration).toHaveBeenCalledWith("cred-1", {
        nickname: "My Key",
      }),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: renamePasskeyStep,
    });
  });

  it("exits editing mode (hides input, shows Rename button) after a successful save", async () => {
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    expect(screen.getByTestId("passkeyNickname")).toBeInTheDocument();

    await userEvent.click(screen.getByTestId("save-fido2-button"));

    await waitFor(() => {
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument();
      expect(screen.getByTestId("rename-fido2-button")).toBeInTheDocument();
    });
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_SUBMIT_COMPLETE,
      step: renamePasskeyStep,
    });
    expect(mockTrackPage).toHaveBeenCalledWith(
      mockPathname,
      renamePasskeyPageIds.success,
      mockRpParams,
    );
  });

  it("keeps the rename step active when save is clicked with a blank nickname", async () => {
    const user = userEvent.setup();

    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await user.click(screen.getByTestId("rename-fido2-button"));
    const input = screen.getByTestId("passkeyNickname");
    await user.clear(input);
    await user.click(screen.getByTestId("save-fido2-button"));

    expect(fido2Api.updateRegistration).not.toHaveBeenCalled();
    expect(screen.getByTestId("passkeyNickname")).toBeInTheDocument();
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_SUBMIT,
      step: renamePasskeyStep,
      error: "error_rename_credential",
    });
  });

  it("tracks rename step end when cancel is clicked", async () => {
    const user = userEvent.setup();

    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await user.click(screen.getByTestId("rename-fido2-button"));
    await user.click(screen.getByTestId("cancel-fido2-button"));

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_STEP_END,
      step: renamePasskeyStep,
    });
  });

  it("returns to read-only mode when the rename API returns a failure response", async () => {
    vi.mocked(fido2Api.updateRegistration).mockResolvedValue({
      success: false,
    });
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument(),
    );
  });

  it("returns to read-only mode when the rename API rejects", async () => {
    vi.mocked(fido2Api.updateRegistration).mockRejectedValue(
      new Error("Network error"),
    );
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument(),
    );
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: GA_FORM_EVENTS.FORM_STEP_END,
      step: renamePasskeyStep,
      error: "error_rename_credential",
    });
  });

  it("returns to read-only mode when the API fails", async () => {
    vi.mocked(fido2Api.updateRegistration).mockResolvedValue({
      success: false,
    });
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(screen.getByTestId("rename-fido2-button")).toBeInTheDocument(),
    );
  });

  it("Save button is disabled while the API call is in progress", async () => {
    // Keep the promise pending so we can observe the disabled state
    let resolveRename;
    vi.mocked(fido2Api.updateRegistration).mockImplementation(
      () => new Promise((res) => (resolveRename = res)),
    );

    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));

    expect(screen.getByTestId("save-fido2-button")).toBeDisabled();

    // Resolve so we don't leave dangling promises
    await act(async () => {
      resolveRename({ success: true });
    });
  });

  it("Save button calls updateRegistration with trimmed nickname", async () => {
    const user = userEvent.setup();
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);
    await user.click(screen.getByTestId("rename-fido2-button"));
    const input = screen.getByTestId("passkeyNickname");
    await user.clear(input);
    await user.type(input, "  Trimmed  ");
    await user.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(fido2Api.updateRegistration).toHaveBeenCalledWith("cred-1", {
        nickname: "Trimmed",
      }),
    );
  });

  it("keeps the saved nickname after reopening rename and cancelling", async () => {
    const user = userEvent.setup();

    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await user.click(screen.getByTestId("rename-fido2-button"));
    let input = screen.getByTestId("passkeyNickname");
    await user.clear(input);
    await user.type(input, "Renamed Key");
    await user.click(screen.getByTestId("save-fido2-button"));

    await waitFor(() =>
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument(),
    );
    expect(screen.getByText("Renamed Key")).toBeInTheDocument();

    await user.click(screen.getByTestId("rename-fido2-button"));
    input = screen.getByTestId("passkeyNickname");
    await user.clear(input);
    await user.type(input, "Temporary Edit");
    await user.click(screen.getByTestId("cancel-fido2-button"));

    expect(screen.getByText("Renamed Key")).toBeInTheDocument();
    expect(screen.queryByText("My Key")).not.toBeInTheDocument();
  });
});
