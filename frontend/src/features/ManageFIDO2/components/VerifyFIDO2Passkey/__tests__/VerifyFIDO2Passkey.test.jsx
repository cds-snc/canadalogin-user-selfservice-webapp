/**
 * Unit tests for VerifyFIDO2Passkey component
 *
 * Tests verify component behaviour:
 * - Shows Loader on mount while FIDO2 authentication is in progress
 * - Automatically triggers FIDO2 verification on mount
 * - Renders UI (heading, body text, SVG, buttons) once authentication completes
 * - Renders the selected passkey nickname in the body text
 * - Shows the Loader text while loading
 * - Calls setAssertionResult with the credential after a successful auth
 * - Calls onCallback after a successful auth
 * - Calls submitAssertionResult when submitAttestationResult prop is true
 * - Sets error code and renders error message when getAssertionOptions fails
 * - Sets error code and renders error message when authenticateFIDO2Credential throws
 * - Filters allowCredentials to the selected passkey when one is provided
 * - Retry button re-triggers the FIDO2 flow
 * - Cancel button navigates back to manage 2FA page
 */
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import VerifyFIDO2Passkey from "../VerifyFIDO2Passkey";

// ─── Router ────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useNavigate: () => mockNavigate,
}));

// ─── Utilities ─────────────────────────────────────────────────────────────

vi.mock("../../../../../utils/routeHelpers.js", () => ({
  path: (_page, { language } = {}) => `/${language}/mock-path`,
}));

vi.mock("../../../../../utils/constants.jsx", () => ({
  PAGES: {
    verifyFIDO2Passkey: "VerifyFIDO2Passkey",
    manage2FAVerifications: "Manage2FAVerifications",
    error: "Error",
  },
  SERVICES: [],
  VITE_ENVIRONMENTS: { dev: "development", test: "test" },
  DEV_ONLY_FEATURE: false,
}));

vi.mock("../../../../../utils/functions.jsx", () => ({
  getPageContent: (_lang, page) => {
    if (page === "VerifyFIDO2Passkey") {
      return {
        1: "Verify with your passkey",
        2: "There will be a pop-up on your device asking for your fingerprint, face, or screen lock.",
        3: "Cancel",
        4: "Continue",
        9: "Loading...",
      };
    }
    if (page === "Error") {
      return {
        error_get_assertion_options: "Failed to get assertion options",
      };
    }
    return {};
  },
}));

// ─── Layout primitives ─────────────────────────────────────────────────────

vi.mock("../../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

// ─── SVG asset ─────────────────────────────────────────────────────────────

vi.mock("../../../../../assets/icons/passkey_collage.svg?react", () => ({
  default: () => <svg data-testid="passkey-collage" />,
}));

// ─── GCDS components ───────────────────────────────────────────────────────

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, ...props }) => <h1 {...props}>{children}</h1>,
  GcdsText: ({ children, ...props }) => <p {...props}>{children}</p>,
  GcdsButton: ({ children, onGcdsClick, buttonRole, ...props }) => (
    <button data-role={buttonRole} onClick={onGcdsClick} {...props}>
      {children}
    </button>
  ),
  GcdsLink: ({ children, onGcdsClick, ...props }) => (
    <a onClick={onGcdsClick} {...props}>
      {children}
    </a>
  ),
  GcdsErrorMessage: ({ children, ...props }) => (
    <div data-testid="error-message" {...props}>
      {children}
    </div>
  ),
}));

// ─── fido2Api ──────────────────────────────────────────────────────────────

const mockGetAssertionOptions = vi.fn();
const mockSubmitAssertionResult = vi.fn();

vi.mock("../../../api/fido2Api.jsx", () => ({
  fido2Api: {
    getAssertionOptions: (...args) => mockGetAssertionOptions(...args),
    submitAssertionResult: (...args) => mockSubmitAssertionResult(...args),
  },
}));

// ─── webAuthnUtils ─────────────────────────────────────────────────────────

const mockAuthenticateFIDO2Credential = vi.fn();

vi.mock("../../../utils/webAuthnUtils", () => ({
  authenticateFIDO2Credential: (...args) =>
    mockAuthenticateFIDO2Credential(...args),
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

const defaultAssertionOptions = {
  success: true,
  data: {
    challenge: "test-challenge",
    allowCredentials: [
      { id: "cred-1", type: "public-key" },
      { id: "cred-2", type: "public-key" },
    ],
  },
};

const defaultAssertionResult = {
  id: "assertion-id",
  rawId: "raw-assertion-id",
  type: "public-key",
};

const defaultPasskey = {
  id: "passkey-42",
  attributes: {
    nickname: "Work Laptop",
    credentialId: "cred-1",
  },
};

const renderComponent = (props = {}) => {
  const defaultProps = {
    setAssertionResult: vi.fn(),
    setErrorCode: vi.fn(),
    onCallback: vi.fn(),
    submitAttestationResult: false,
    errorMessage: "",
    selectedPasskey: defaultPasskey,
  };
  return render(<VerifyFIDO2Passkey {...defaultProps} {...props} />);
};

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("VerifyFIDO2Passkey", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: successful auth flow
    mockGetAssertionOptions.mockResolvedValue(defaultAssertionOptions);
    mockAuthenticateFIDO2Credential.mockResolvedValue(defaultAssertionResult);
    mockSubmitAssertionResult.mockResolvedValue({ success: true });
  });

  // ── Loader ────────────────────────────────────────────────────────────

  it("shows Loader with loading text while authentication is in progress", async () => {
    // Keep getAssertionOptions pending so the loading state persists
    let resolve;
    mockGetAssertionOptions.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );

    renderComponent();

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByTestId("loader")).toHaveTextContent("Loading...");

    // Resolve to clean up
    resolve(defaultAssertionOptions);
  });

  // ── Successful flow ───────────────────────────────────────────────────

  it("renders heading and buttons after successful authentication", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Verify with your passkey" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Continue")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });

  it("renders the passkey collage SVG icon after loading", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("passkey-collage")).toBeInTheDocument();
  });

  it("renders the selected passkey nickname in the body text", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Work Laptop")).toBeInTheDocument();
  });

  it("calls setAssertionResult with the credential after successful auth", async () => {
    const setAssertionResult = vi.fn();
    renderComponent({ setAssertionResult });

    await waitFor(() => {
      expect(setAssertionResult).toHaveBeenCalledWith(defaultAssertionResult);
    });
  });

  it("calls onCallback after successful auth", async () => {
    const onCallback = vi.fn();
    renderComponent({ onCallback });

    await waitFor(() => {
      expect(onCallback).toHaveBeenCalledOnce();
    });
  });

  it("does not call submitAssertionResult when submitAttestationResult is false", async () => {
    renderComponent({ submitAttestationResult: false });

    await waitFor(() => {
      expect(mockSubmitAssertionResult).not.toHaveBeenCalled();
    });
  });

  it("calls submitAssertionResult when submitAttestationResult is true", async () => {
    renderComponent({ submitAttestationResult: true });

    await waitFor(() => {
      expect(mockSubmitAssertionResult).toHaveBeenCalledWith(
        defaultAssertionResult,
      );
    });
  });

  // ── Credential filtering ──────────────────────────────────────────────

  it("filters allowCredentials to only the selected passkey's credentialId", async () => {
    renderComponent();

    await waitFor(() => {
      expect(mockAuthenticateFIDO2Credential).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: [{ id: "cred-1", type: "public-key" }],
        }),
      );
    });
  });

  it("does not filter allowCredentials when selectedPasskey has no credentialId", async () => {
    const passkeyWithoutCredId = {
      id: "passkey-99",
      attributes: { nickname: "Old Key" },
    };
    renderComponent({ selectedPasskey: passkeyWithoutCredId });

    await waitFor(() => {
      expect(mockAuthenticateFIDO2Credential).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: defaultAssertionOptions.data.allowCredentials,
        }),
      );
    });
  });

  it("does not filter allowCredentials when selectedPasskey is undefined", async () => {
    renderComponent({ selectedPasskey: undefined });

    await waitFor(() => {
      expect(mockAuthenticateFIDO2Credential).toHaveBeenCalledWith(
        expect.objectContaining({
          allowCredentials: defaultAssertionOptions.data.allowCredentials,
        }),
      );
    });
  });

  // ── Error: getAssertionOptions failure ────────────────────────────────

  it("calls setErrorCode when getAssertionOptions returns success: false", async () => {
    mockGetAssertionOptions.mockResolvedValue({ success: false });
    const setErrorCode = vi.fn();

    renderComponent({ setErrorCode });

    await waitFor(() => {
      expect(setErrorCode).toHaveBeenCalledWith("error_fido2_verification");
    });
  });

  it("calls setErrorCode when getAssertionOptions rejects", async () => {
    mockGetAssertionOptions.mockRejectedValue(new Error("Network error"));
    const setErrorCode = vi.fn();

    renderComponent({ setErrorCode });

    await waitFor(() => {
      expect(setErrorCode).toHaveBeenCalledWith("error_fido2_verification");
    });
  });

  // ── Error: authenticateFIDO2Credential failure ────────────────────────

  it("calls setErrorCode when authenticateFIDO2Credential throws", async () => {
    mockAuthenticateFIDO2Credential.mockRejectedValue(
      new Error("User cancelled"),
    );
    const setErrorCode = vi.fn();

    renderComponent({ setErrorCode });

    await waitFor(() => {
      expect(setErrorCode).toHaveBeenCalledWith("error_fido2_verification");
    });
  });

  it("shows the error message passed via errorMessage prop when an error occurs", async () => {
    mockAuthenticateFIDO2Credential.mockRejectedValue(
      new Error("User cancelled"),
    );

    renderComponent({ errorMessage: "Something went wrong" });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByTestId("error-message")).toHaveTextContent(
      "Something went wrong",
    );
  });

  it("does not render GcdsErrorMessage when errorMessage is empty", async () => {
    renderComponent({ errorMessage: "" });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.queryByTestId("error-message")).not.toBeInTheDocument();
  });

  // ── Retry button ──────────────────────────────────────────────────────

  it("retries the FIDO2 flow when the Continue button is clicked", async () => {
    // First call fails so the UI becomes visible
    mockGetAssertionOptions
      .mockResolvedValueOnce({ success: false })
      .mockResolvedValue(defaultAssertionOptions);

    const onCallback = vi.fn();
    renderComponent({ onCallback });

    // Wait for the initial (failed) attempt to settle and UI to appear
    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    // Trigger retry
    await userEvent.click(screen.getByText("Continue"));

    await waitFor(() => {
      expect(onCallback).toHaveBeenCalledOnce();
    });

    // getAssertionOptions should have been called twice total
    expect(mockGetAssertionOptions).toHaveBeenCalledTimes(2);
  });

  // ── Cancel button ─────────────────────────────────────────────────────

  it("navigates back to manage 2FA page when Cancel is clicked", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    await userEvent.click(screen.getByText("Cancel"));

    expect(mockNavigate).toHaveBeenCalledWith("/en/mock-path");
  });

  // ── Nickname display ─────────────────────────────────────────────────

  it("renders without crashing when selectedPasskey is undefined", async () => {
    renderComponent({ selectedPasskey: undefined });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Verify with your passkey" }),
    ).toBeInTheDocument();
  });

  it("renders correctly when selectedPasskey has no nickname", async () => {
    renderComponent({
      selectedPasskey: { id: "passkey-10", attributes: {} },
    });

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(
      screen.getByRole("heading", { name: "Verify with your passkey" }),
    ).toBeInTheDocument();
  });

  // ── Body text ────────────────────────────────────────────────────────

  it("renders the instruction body text after loading", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(
      screen.getByText(
        "There will be a pop-up on your device asking for your fingerprint, face, or screen lock.",
      ),
    ).toBeInTheDocument();
  });

  // ── Button roles ─────────────────────────────────────────────────────

  it("Continue button has primary role", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Continue")).toHaveAttribute(
      "data-role",
      "primary",
    );
  });

  it("Cancel button has secondary role", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Cancel")).toHaveAttribute(
      "data-role",
      "secondary",
    );
  });
});
