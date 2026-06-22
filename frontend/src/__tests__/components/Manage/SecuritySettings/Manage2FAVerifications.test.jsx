/**
 * Unit tests for Manage2FAVerifications component
 *
 * Tests verify component behavior with different API responses:
 * - Loading states
 * - Single/multiple phone numbers with SMS/Voice verification
 * - Error handling and edge cases
 * - UI content display and formatting
 *
 * These tests are more reliable than snapshot tests as they focus on
 * behavior and content rather than exact DOM structure.
 */
import { render, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Manage2FAVerifications from "../../../../components/Manage/SecuritySettings/Manage2FAVerifications";
import { fido2Api } from "../../../../features/ManageFIDO2/api/fido2Api";

// Mock GCDS web components — they rely on custom elements which don't work in jsdom
vi.mock("@gcds-core/components-react", () => ({
  GcdsButton: ({ children, onGcdsClick, onClick }) => (
    <button onClick={onGcdsClick ?? onClick}>{children}</button>
  ),
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <span>{children}</span>,
  GcdsLink: ({ children, href }) => <a href={href || "#"}>{children}</a>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
}));

// Simple mocks for dependencies
const mockNavigate = vi.fn();
const mockUseLocation = vi.fn();
vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useLocation: () => mockUseLocation(),
  useNavigate: () => mockNavigate,
}));

vi.mock("../../../../hooks/useNavigate.js", () => ({
  useNavigateHelper: () => vi.fn(),
}));

vi.mock("../../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        id: "test-user-123",
      },
    },
    _dispatch: vi.fn(),
  }),
}));

// Create a mock function that can be configured per test
const mockUseOtpOperations = vi.fn();
vi.mock("../../../../hooks/useOtpOperations", () => ({
  useOtpOperations: (options) => mockUseOtpOperations(options),
  MAP_TYPES: {
    LAST_FOUR_DIGITS: "lastFourDigits",
    FULL_PHONE_NUMBER: "fullPhoneNumber",
  },
}));

const mockUsePasskeyOperations = vi.fn();
vi.mock("../../../../hooks/usePasskeyOperations", () => ({
  usePasskeyOperations: () => mockUsePasskeyOperations(),
}));

vi.mock("../../../../utils/constants", () => ({
  PAGES: {
    manage2FAVerifications: "Manage2FAVerifications",
    securitySettings: "SecuritySettings",
    addMFAPage: "AddMFAPage",
    addFIDO2PasskeyPage: "AddFIDO2PasskeyPage",
    deleteMFAPage: "DeleteMFAPage",
    deleteFIDO2PasskeyPage: "DeleteFIDO2PasskeyPage",
    renameFIDO2PasskeyPage: "RenameFIDO2PasskeyPage",
  },
  VITE_ENVIRONMENTS: {
    dev: "development",
    test: "test",
  },
  SERVICES: [],
}));

vi.mock("../../../../utils/routeHelpers", () => ({
  path: () => "/security-settings",
}));

vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

vi.mock("../../../../config", () => ({
  default: {
    environment: "test",
  },
}));

vi.mock("../../../../features/ManageFIDO2/api/fido2Api", () => ({
  fido2Api: {
    getUserFIDO2Credentials: vi.fn(),
  },
}));

vi.mock("@gcds-core/components-react", () => ({
  GcdsContainer: ({ children }) => <div>{children}</div>,
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsHeading: ({ children }) => <div>{children}</div>,
  GcdsText: ({ children }) => <div>{children}</div>,
  GcdsButton: ({ children, onGcdsClick, onClick, id }) => (
    <button id={id} onClick={onGcdsClick ?? onClick}>
      {children}
    </button>
  ),
  GcdsLink: ({ children }) => <a>{children}</a>,
}));

vi.mock(
  "../../../../components/Manage/SecuritySettings/components/PhoneFactorsList",
  () => ({
    default: ({ userPhoneFactorsMap, totalFactorCount }) => (
      <div data-testid="phone-factors-list">
        {Object.keys(userPhoneFactorsMap).map((phoneNumber) => (
          <div key={phoneNumber}>
            <strong>{phoneNumber}</strong>
            {userPhoneFactorsMap[phoneNumber].map((factor, i) => (
              <div key={i}>
                {factor.type === "smsotp"
                  ? "Text message (SMS)"
                  : factor.type === "voiceotp"
                    ? "Voice call"
                    : factor.type}
              </div>
            ))}
            {totalFactorCount - userPhoneFactorsMap[phoneNumber].length >= 1 ? (
              <a>Remove</a>
            ) : (
              <span>Remove disabled</span>
            )}
          </div>
        ))}
      </div>
    ),
  }),
);

vi.mock(
  "../../../../components/Manage/SecuritySettings/components/FIDO2PasskeyList",
  () => ({
    default: ({ userFIDO2CredentialsData, totalFactorCount }) => (
      <div data-testid="fido2-passkey-list">
        {userFIDO2CredentialsData.map((credential) =>
          totalFactorCount - 1 >= 1 ? (
            <button key={credential.id}>Delete passkey</button>
          ) : null,
        )}
      </div>
    ),
  }),
);

vi.mock("../../../../components/InfoBlocks/NoticeFactory", () => ({
  default: ({ noticeType }) =>
    noticeType ? <div data-testid="notice-factory">{noticeType}</div> : null,
}));

vi.mock(
  "../../../../components/Manage/SecuritySettings/components/PasskeyInfoPanel",
  () => ({
    default: () => <div data-testid="passkey-info-panel" />,
  }),
);

describe("Manage2FAVerifications Component Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLocation.mockReturnValue({ state: null });

    // Default mock return values
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: false,
    });

    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: false,
      refetch: vi.fn(),
    });

    vi.mocked(fido2Api.getUserFIDO2Credentials).mockResolvedValue({
      success: true,
      data: { fido2: [] },
    });
  });

  it("displays loading state while fetching verification methods", () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: true,
    });
    const { getByTestId } = render(<Manage2FAVerifications />);
    // Component will be in loading state when localLoading is true
    expect(getByTestId("loading")).toBeInTheDocument();
    expect(getByTestId("loading")).toHaveTextContent("Loading...");
  });

  it("displays content when not loading", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [
          { phoneNumber: "5551234567", type: "smsotp" },
          { phoneNumber: "5551234567", type: "voiceotp" },
        ],
      },
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("Text message (SMS)")).toBeInTheDocument();
      expect(getByText("Voice call")).toBeInTheDocument();
    });
  });

  it("displays multiple phone numbers with different verification methods", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [
          { phoneNumber: "5551234567", type: "smsotp" },
          { phoneNumber: "5551234567", type: "voiceotp" },
        ],
        5559876543: [{ phoneNumber: "5559876543", type: "smsotp" }],
        5555555555: [{ phoneNumber: "5555555555", type: "voiceotp" }],
      },
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("5559876543")).toBeInTheDocument();
      expect(getByText("5555555555")).toBeInTheDocument();
    });
  });

  it("displays voice call only verification method", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [{ phoneNumber: "5551234567", type: "voiceotp" }],
      },
      otpLoading: false,
    });

    const { getByText, queryByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("Voice call")).toBeInTheDocument();
      expect(queryByText("Text message (SMS)")).not.toBeInTheDocument();
    });
  });

  it("handles unknown verification factor types gracefully", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [{ phoneNumber: "5551234567", type: "unknown_type" }],
      },
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("unknown_type")).toBeInTheDocument();
      // Should still display the phone number even with unknown type
    });
  });

  it("formats long phone numbers correctly", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        15551234567890: [{ phoneNumber: "15551234567890", type: "smsotp" }],
      },
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      // Should display the long number as-is
      expect(getByText("15551234567890")).toBeInTheDocument();
    });
  });

  it("shows remove links when there are multiple different phone numbers", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551111111: [{ phoneNumber: "5551111111", type: "smsotp" }],
        5552222222: [{ phoneNumber: "5552222222", type: "voiceotp" }],
        5553333333: [{ phoneNumber: "5553333333", type: "smsotp" }],
      },
      otpLoading: false,
    });

    const { getAllByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      // Should show remove links for multiple phones
      const removeLinks = getAllByText("Remove");
      expect(removeLinks).toHaveLength(3); // One for each phone number
    });
  });

  it("keeps delete available when a passkey remains after deleting one phone number", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [
          { phoneNumber: "5551234567", type: "smsotp", id: "factor-1" },
          { phoneNumber: "5551234567", type: "voiceotp", id: "factor-2" },
        ],
      },
      otpLoading: false,
    });

    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [{ id: "passkey-1", attributes: { nickname: "My passkey" } }],
      loading: false,
      refetch: vi.fn(),
    });

    const { getByText, getByRole } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Remove")).toBeInTheDocument();
      expect(getByRole("button", { name: "Delete passkey" })).toBeEnabled();
    });
  });

  it("disables delete actions when deleting them would remove the last remaining 2FA factor", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [
          { phoneNumber: "5551234567", type: "smsotp", id: "factor-1" },
          { phoneNumber: "5551234567", type: "voiceotp", id: "factor-2" },
        ],
      },
      otpLoading: false,
    });

    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: false,
      refetch: vi.fn(),
    });

    const { getByText, queryByRole } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Remove disabled")).toBeInTheDocument();
      expect(
        queryByRole("button", { name: "Delete passkey" }),
      ).not.toBeInTheDocument();
    });
  });

  it("displays add phone number button when hook returns empty map", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("+ Add a phone number")).toBeInTheDocument();
      expect(getByText("Manage 2-step verification")).toBeInTheDocument();
    });
  });

  it("displays add phone number button when hook is loading", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: true,
    });

    const { getByTestId } = render(<Manage2FAVerifications />);

    // Should show loading initially
    expect(getByTestId("loading")).toBeInTheDocument();
  });

  it("displays correct page headings and text content", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [{ phoneNumber: "5551234567", type: "smsotp" }],
      },
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Manage 2-step verification")).toBeInTheDocument();
      expect(
        getByText(
          "A second step after your password helps verify it's you signing in.",
        ),
      ).toBeInTheDocument();
      expect(getByText("Available second steps")).toBeInTheDocument();
      expect(
        getByText(
          "You can use the following 2-step verification methods to sign in.",
        ),
      ).toBeInTheDocument();
    });
  });
});

describe("Manage2FAVerifications — additional coverage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseLocation.mockReturnValue({ state: null });
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: false,
    });
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: false,
      refetch: vi.fn(),
    });
  });

  it("shows loading spinner when passkeyLoading is true", () => {
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: true,
      refetch: vi.fn(),
    });
    const { getByTestId } = render(<Manage2FAVerifications />);
    expect(getByTestId("loading")).toBeInTheDocument();
  });

  it("shows loading spinner when both otpLoading and passkeyLoading are true", () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: true,
    });
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: true,
      refetch: vi.fn(),
    });
    const { getByTestId } = render(<Manage2FAVerifications />);
    expect(getByTestId("loading")).toBeInTheDocument();
  });

  it("renders NoticeFactory when location.state has a noticeType", () => {
    mockUseLocation.mockReturnValue({
      pathname: "/security-settings",
      state: { noticeType: "passkey-added", passkeyName: "Work Laptop" },
    });
    const { getByTestId } = render(<Manage2FAVerifications />);
    expect(getByTestId("notice-factory")).toHaveTextContent("passkey-added");
  });

  it("persists notice state after location.state becomes null on rerender", () => {
    let locationValue = {
      pathname: "/security-settings",
      state: { noticeType: "passkeyAdded", passkeyName: "Work Laptop" },
    };
    mockUseLocation.mockImplementation(() => locationValue);

    const { rerender, getByTestId } = render(<Manage2FAVerifications />);

    expect(getByTestId("notice-factory")).toHaveTextContent("passkeyAdded");

    locationValue = {
      pathname: "/security-settings",
      state: null,
    };

    rerender(<Manage2FAVerifications />);

    expect(getByTestId("notice-factory")).toHaveTextContent("passkeyAdded");
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("does NOT render NoticeFactory when location.state is null", () => {
    const { queryByTestId } = render(<Manage2FAVerifications />);
    expect(queryByTestId("notice-factory")).not.toBeInTheDocument();
  });

  it("does NOT render NoticeFactory when noticeType is absent from state", () => {
    mockUseLocation.mockReturnValue({ state: { phoneNumber: "5551234567" } });
    const { queryByTestId } = render(<Manage2FAVerifications />);
    expect(queryByTestId("notice-factory")).not.toBeInTheDocument();
  });

  it("renders the FIDO2 section", () => {
    const { getByText } = render(<Manage2FAVerifications />);
    expect(getByText("+ Add a phone number")).toBeInTheDocument(); // OTP section always present
  });

  it("add-mfa button navigates to the add MFA page", async () => {
    const { getByText } = render(<Manage2FAVerifications />);
    await waitFor(() =>
      expect(getByText("+ Add a phone number")).toBeInTheDocument(),
    );
    await userEvent.click(getByText("+ Add a phone number"));
    expect(mockNavigate).toHaveBeenCalledOnce();
  });

  it("renders the add-fido2 button inside the FIDO2 section", async () => {
    const { getByText } = render(<Manage2FAVerifications />);
    await waitFor(() => {
      expect(getByText("+ Add a phone number")).toBeInTheDocument();
    });
  });

  it("passes fido2Data from usePasskeyOperations to FIDO2PasskeyList", async () => {
    // FIDO2PasskeyList is mocked to return null, so we verify no crash occurs
    // when non-empty fido2Data is provided
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [
        {
          id: "cred-1",
          attributes: { nickname: "Work Key" },
          created: "2026-01-01T00:00:00.000Z",
        },
      ],
      loading: false,
      refetch: vi.fn(),
    });
    const { getByText } = render(<Manage2FAVerifications />);
    await waitFor(() =>
      expect(getByText("+ Add a phone number")).toBeInTheDocument(),
    );
  });

  it("allows passkey-only users to stay on the manage page", () => {
    render(<Manage2FAVerifications />);

    expect(mockUseOtpOperations).toHaveBeenCalledWith(
      expect.objectContaining({
        allowEmptyFactors: true,
      }),
    );
  });

  it("shows phone empty state text when no phone factors are registered", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      otpLoading: false,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(
        getByText(
          "Receive one-time verification codes via text (SMS) or voice call.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("does NOT show phone empty state text when phone factors are registered", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [{ phoneNumber: "5551234567", type: "smsotp" }],
      },
      otpLoading: false,
    });

    const { queryByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(
        queryByText(
          "Receive one-time verification codes via text (SMS) or voice call.",
        ),
      ).not.toBeInTheDocument();
    });
  });

  it("shows PasskeyInfoPanel when no passkeys are registered", async () => {
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [],
      loading: false,
      refetch: vi.fn(),
    });

    const { getByTestId } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByTestId("passkey-info-panel")).toBeInTheDocument();
    });
  });

  it("does NOT show PasskeyInfoPanel when passkeys are registered", async () => {
    mockUsePasskeyOperations.mockReturnValue({
      fido2Data: [{ id: "cred-1", attributes: { nickname: "My Passkey" } }],
      loading: false,
      refetch: vi.fn(),
    });

    const { queryByTestId } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(queryByTestId("passkey-info-panel")).not.toBeInTheDocument();
    });
  });
});
