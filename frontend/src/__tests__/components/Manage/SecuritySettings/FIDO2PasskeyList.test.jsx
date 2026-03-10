/**
 * Unit tests for FIDO2PasskeyList component
 *
 * Tests verify component behavior:
 * - Rendering with empty data
 * - Rendering single and multiple passkey items
 * - Displaying nickname and created-on date (date only, no time)
 * - Navigation on Rename and Delete button clicks
 */
import { render, screen, waitFor } from "@testing-library/react";
import { fido2Api } from "../../../../features/ManageFIDO2/api/fido2Api.jsx";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import FIDO2PasskeyList from "../../../../components/Manage/SecuritySettings/FIDO2PasskeyList";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../features/ManageFIDO2/api/fido2Api.jsx", () => ({
  fido2Api: {
    updateRegistration: vi.fn(),
  },
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

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsText: ({ children }) => <p data-testid="gcds-text">{children}</p>,
  GcdsGrid: ({ children }) => <div data-testid="gcds-grid">{children}</div>,
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

  it("renders each item inside a GcdsContainer", () => {
    const credentials = [
      makeCredential({ id: "cred-1" }),
      makeCredential({ id: "cred-2" }),
    ];
    render(<FIDO2PasskeyList userFIDO2CredentialsData={credentials} />);
    expect(screen.getAllByTestId("gcds-container")).toHaveLength(2);
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
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={vi.fn()}
      />,
    );
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() =>
      expect(fido2Api.updateRegistration).toHaveBeenCalledWith("cred-1", {
        nickname: "My Key",
      }),
    );
  });

  it("calls onRenameSuccess after a successful save", async () => {
    const onRenameSuccess = vi.fn();
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={onRenameSuccess}
      />,
    );
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    await waitFor(() => expect(onRenameSuccess).toHaveBeenCalledOnce());
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
  });

  it("does NOT call onRenameSuccess when the rename API returns a failure response", async () => {
    vi.mocked(fido2Api.updateRegistration).mockResolvedValue({
      success: false,
    });
    const onRenameSuccess = vi.fn();
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={onRenameSuccess}
      />,
    );
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    // Editing always closes after the API call completes
    await waitFor(() =>
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument(),
    );
    expect(onRenameSuccess).not.toHaveBeenCalled();
  });

  it("does NOT call onRenameSuccess when the rename API rejects", async () => {
    vi.mocked(fido2Api.updateRegistration).mockRejectedValue(
      new Error("Network error"),
    );
    const onRenameSuccess = vi.fn();
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={onRenameSuccess}
      />,
    );
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    // Editing always closes after the API call completes
    await waitFor(() =>
      expect(screen.queryByTestId("passkeyNickname")).not.toBeInTheDocument(),
    );
    expect(onRenameSuccess).not.toHaveBeenCalled();
  });

  it("does NOT call onRenameSuccess when the API fails", async () => {
    vi.mocked(fido2Api.updateRegistration).mockResolvedValue({
      success: false,
    });
    const onRenameSuccess = vi.fn();
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={onRenameSuccess}
      />,
    );
    await userEvent.click(screen.getByTestId("rename-fido2-button"));
    await userEvent.click(screen.getByTestId("save-fido2-button"));
    // Wait for editing to close (async API has settled)
    await waitFor(() =>
      expect(screen.getByTestId("rename-fido2-button")).toBeInTheDocument(),
    );
    expect(onRenameSuccess).not.toHaveBeenCalled();
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
    resolveRename({ success: true });
  });

  it("Save button calls updateRegistration with trimmed nickname", async () => {
    const user = userEvent.setup();
    render(
      <FIDO2PasskeyList
        userFIDO2CredentialsData={[credential]}
        onRenameSuccess={vi.fn()}
      />,
    );
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
});
