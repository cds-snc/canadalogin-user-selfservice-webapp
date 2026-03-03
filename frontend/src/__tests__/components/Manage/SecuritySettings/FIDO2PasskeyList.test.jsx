/**
 * Unit tests for FIDO2PasskeyList component
 *
 * Tests verify component behavior:
 * - Rendering with empty data
 * - Rendering single and multiple passkey items
 * - Displaying nickname and created-on date (date only, no time)
 * - Navigation on Rename and Delete button clicks
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import FIDO2PasskeyList from "../../../../components/Manage/SecuritySettings/FIDO2PasskeyList";

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../utils/functions.jsx", () => ({
  getPageContent: () => ({
    13: "Delete",
    14: "Rename",
    16: "Created on ",
  }),
}));

vi.mock("../../../../utils/constants.jsx", () => ({
  PAGES: {
    manage2FAVerifications: "Manage2FAVerifications",
    deleteFIDO2PasskeyPage: "deleteFIDO2PasskeyPage",
    renameFIDO2PasskeyPage: "renameFIDO2PasskeyPage",
  },
}));

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: (_page, { language } = {}) => `/${language}/mock-path`,
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsText: ({ children }) => <p data-testid="gcds-text">{children}</p>,
  GcdsGrid: ({ children }) => <div data-testid="gcds-grid">{children}</div>,
  GcdsButton: ({ children, onGcdsClick, onClick, id }) => (
    <button data-testid={id} onClick={onGcdsClick ?? onClick}>
      {children}
    </button>
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

  it("navigates to the rename page when Rename is clicked", async () => {
    const credential = makeCredential({
      id: "cred-1",
      attributes: { nickname: "My Key" },
    });
    render(<FIDO2PasskeyList userFIDO2CredentialsData={[credential]} />);

    await userEvent.click(screen.getByTestId("rename-fido2-button"));

    expect(mockNavigate).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path", {
      state: { passkeyId: "cred-1", passkeyNickname: "My Key" },
    });
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
