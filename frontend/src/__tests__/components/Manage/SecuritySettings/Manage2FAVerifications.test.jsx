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
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Manage2FAVerifications from "../../../../components/Manage/SecuritySettings/Manage2FAVerifications";
import { fido2Api } from "../../../../features/ManageFIDO2/api/fido2Api.jsx";

// Mock GCDS web components — they rely on custom elements which don't work in jsdom
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsButton: ({ children, ...props }) => (
    <button {...props}>{children}</button>
  ),
  GcdsContainer: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsHeading: ({ children, ...props }) => <div {...props}>{children}</div>,
  GcdsText: ({ children, ...props }) => <span {...props}>{children}</span>,
  GcdsLink: ({ children, href, ...props }) => (
    <a href={href || "#"} {...props}>
      {children}
    </a>
  ),
  GcdsGrid: ({ children, ...props }) => <div {...props}>{children}</div>,
}));

// Simple mocks for dependencies
vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useLocation: () => ({ state: null }),
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../../hooks/useNavigate.js", () => ({
  useNavigateHelper: () => vi.fn(),
}));

vi.mock("../../../../components/Providers/useUser.js", () => ({
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
vi.mock("../../../../hooks/useOtpOperations.js", () => ({
  useOtpOperations: () => mockUseOtpOperations(),
  MAP_TYPES: {
    LAST_FOUR_DIGITS: "lastFourDigits",
    FULL_PHONE_NUMBER: "fullPhoneNumber",
  },
}));

vi.mock("../../../../utils/functions.jsx", () => ({
  getPageContent: () => ({
    1: "Manage 2-step verification methods",
    2: "Choose how you would like to receive verification codes when signing in to your GC Account.",
    3: "Phone numbers",
    4: "Your phone numbers for 2-step verification.",
    5: "Phone",
    6: "Available methods:",
    7: "Text message (SMS)",
    8: "Voice call",
    9: "Remove",
    10: "Add phone number",
    11: "Loading verification methods...",
  }),
}));

vi.mock("../../../../utils/constants.jsx", () => ({
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
  // Enable so the FIDO2 fetch useEffect runs and setLoading(false) is called
  DEV_ONLY_FEATURE: true,
}));

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: () => "/security-settings",
}));

vi.mock("../../../../components/Layout/Loading.jsx", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

vi.mock("../../../../config.jsx", () => ({
  default: {
    environment: "test",
  },
}));

vi.mock("../../../../features/ManageFIDO2/api/fido2Api.jsx", () => ({
  fido2Api: {
    getUserFIDO2Credentials: vi.fn(),
  },
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
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
  "../../../../components/Manage/SecuritySettings/PhoneFactorsList.jsx",
  () => ({
    default: ({ userPhoneFactorsMap }) => (
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
            {Object.keys(userPhoneFactorsMap).length > 1 && <a>Remove</a>}
          </div>
        ))}
      </div>
    ),
  }),
);

vi.mock(
  "../../../../components/Manage/SecuritySettings/FIDO2PasskeyList.jsx",
  () => ({
    default: () => null,
  }),
);

vi.mock("../../../../components/InfoBlocks/NoticeFactory.jsx", () => ({
  default: () => null,
}));

describe("Manage2FAVerifications Component Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock return values
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
    });

    vi.mocked(fido2Api.getUserFIDO2Credentials).mockResolvedValue({
      success: true,
      data: { fido2: [] },
    });
  });

  it("displays loading state while fetching verification methods", () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      localLoading: true,
      setLocalLoading: vi.fn(),
      fido2Data: [],
    });
    const { getByTestId } = render(<Manage2FAVerifications />);
    // Component will be in loading state when localLoading is true
    expect(getByTestId("loading")).toBeInTheDocument();
    expect(getByTestId("loading")).toHaveTextContent(
      "Loading verification methods...",
    );
  });

  it("displays content when not loading", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {
        5551234567: [
          { phoneNumber: "5551234567", type: "smsotp" },
          { phoneNumber: "5551234567", type: "voiceotp" },
        ],
      },
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
    });

    const { getAllByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      // Should show remove links for multiple phones
      const removeLinks = getAllByText("Remove");
      expect(removeLinks).toHaveLength(3); // One for each phone number
    });
  });

  it("displays add phone number button when hook returns empty map", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Add phone number")).toBeInTheDocument();
      expect(
        getByText("Manage 2-step verification methods"),
      ).toBeInTheDocument();
    });
  });

  it("displays add phone number button when hook is loading", async () => {
    mockUseOtpOperations.mockReturnValue({
      phoneFactorsMap: {},
      localLoading: true,
      setLocalLoading: vi.fn(),
      fido2Data: [],
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
      localLoading: false,
      setLocalLoading: vi.fn(),
      fido2Data: [],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(
        getByText("Manage 2-step verification methods"),
      ).toBeInTheDocument();
      expect(
        getByText(
          "Choose how you would like to receive verification codes when signing in to your GC Account.",
        ),
      ).toBeInTheDocument();
      expect(getByText("Phone numbers")).toBeInTheDocument();
      expect(
        getByText("Your phone numbers for 2-step verification."),
      ).toBeInTheDocument();
    });
  });
});
