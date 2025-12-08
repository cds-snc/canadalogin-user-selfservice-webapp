import "@testing-library/jest-dom/vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router";
import ConfirmLanguageUpdate from "../components/ConfirmUpdate.jsx";

// ────────────────────────────────────────────────
// Mocks
// ────────────────────────────────────────────────
const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useLocation: () => ({
      state: {
        updatedLanguage: {
          languageCode: "en",
          updatedPreferredLanguage: "fr-ca",
        },
      },
    }),
    useNavigate: () => mockNavigate,
  };
});

vi.mock("../../../utils/functions.jsx", () => ({
  getPageContent: vi.fn(() => ({
    1: "Confirm language update",
    2: "You are changing your language to",
    4: "Once confirmed, the interface will update.",
    5: "Step 1",
    8: "Confirm",
    9: "Cancel",
    10: "Step 2",
  })),
  convertLanguageToLanguageCode: vi.fn((val) =>
    val.startsWith("fr") ? "fr" : "en",
  ),
}));

vi.mock("../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page, params) => `/${params.language}/${page}`),
}));

vi.mock("../../../utils/constants.jsx", () => ({
  PAGES: {
    confirmLanguageUpdate: "confirm",
    otpSelection: "otp-selection",
    error: "error",
    editLanguagePreferences: "edit",
    ProfileHome: "home",
    successfullyUpdatedLanguage: "success",
  },
  LANGUAGE_DISPLAY_NAMES: {
    en: { "fr-ca": "French" },
    fr: { "en-ca": "Anglais" },
  },
}));

const mockUpdateProfileSuccess = vi.fn();
vi.mock("../../../utils/userProfileDispatch.jsx", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: mockUpdateProfileSuccess,
  }),
}));

vi.mock("../../../components/Providers/useUser.tsx", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        userName: "testuser",
      },
      relyingPartyInfo: {
        icon: "test-icon.png",
        id: "test-service-id",
        linkName: "Test Service",
        url: "https://test-service.example.com",
      },
    },
    dispatch: vi.fn(),
  }),
}));

vi.mock("../../../services/authService.jsx", () => ({
  authService: {
    update_my_user_profile: vi.fn(),
  },
}));

vi.mock("../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsContainer: ({ children }) => (
    <div data-testid="gcds-container">{children}</div>
  ),
  GcdsHeading: ({ children }) => <h1>{children}</h1>,
  GcdsText: ({ children, ...props }) => (
    <p data-testid="gcds-text" {...props}>
      {children}
    </p>
  ),
  GcdsButton: ({ children, onGcdsClick, buttonRole, ...props }) => (
    <button
      data-testid={
        buttonRole === "secondary" ? "secondary-button" : "primary-button"
      }
      onClick={onGcdsClick}
      {...props}
    >
      {children}
    </button>
  ),
  GcdsGrid: ({ children }) => <div>{children}</div>,
  GcdsErrorMessage: ({ children }) => <div data-testid="error">{children}</div>,
}));

// ────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────
describe("ConfirmLanguageUpdate Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const setup = (overrideProps = {}) => {
    const defaultProps = {
      languageFormData: {
        languageCode: "en",
        updatedPreferredLanguage: "fr-ca",
      },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      onBack: vi.fn(),
      errorMessage: "",
      setErrorCode: vi.fn(),
      localLoading: false,
      ...overrideProps,
    };

    return render(
      <BrowserRouter>
        <ConfirmLanguageUpdate {...defaultProps} />
      </BrowserRouter>,
    );
  };

  it("renders localized text and translated language name correctly", () => {
    setup();

    const textElements = screen.getAllByTestId("gcds-text");
    const languageChangeText = textElements.find((el) =>
      el.textContent.includes("You are changing your language to"),
    );

    expect(languageChangeText).toBeInTheDocument();
    expect(languageChangeText).toHaveTextContent(
      "You are changing your language to French.",
    );
    expect(screen.getByText("French")).toBeInTheDocument();
  });

  it("calls onConfirm when confirm button is clicked", async () => {
    const mockOnConfirm = vi.fn().mockResolvedValue();
    setup({ onConfirm: mockOnConfirm });

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled();
    });
  });

  it("disables button when localLoading is true", () => {
    setup({ localLoading: true });

    const confirmButton = screen.getByText("Confirm");
    expect(confirmButton).toBeDisabled();
  });

  it("displays error message when errorMessage prop is provided", () => {
    setup({ errorMessage: "Something went wrong" });

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const mockOnCancel = vi.fn();
    setup({ onCancel: mockOnCancel });

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockOnCancel).toHaveBeenCalled();
  });
});
