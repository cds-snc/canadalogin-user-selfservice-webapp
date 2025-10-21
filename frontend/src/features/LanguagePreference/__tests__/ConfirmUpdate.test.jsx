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

  const setup = () =>
    render(
      <BrowserRouter>
        <ConfirmLanguageUpdate />
      </BrowserRouter>,
    );

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

  it("calls authService.update_my_user_profile on confirm click", async () => {
    const { authService } = await import("../../../services/authService.jsx");
    authService.update_my_user_profile.mockResolvedValueOnce({
      data: { preferredLanguage: "fr-ca" },
    });

    setup();

    const confirmButton = screen.getByText("Confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(authService.update_my_user_profile).toHaveBeenCalledWith({
        preferredLanguage: "fr-ca",
        userName: "testuser",
      });
    });

    await waitFor(() => {
      expect(mockUpdateProfileSuccess).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/fr/success",
        expect.objectContaining({
          state: expect.objectContaining({
            updatedLanguage: expect.any(Object),
          }),
        }),
      );
    });
  });

  it("displays loader when saving", async () => {
    const { authService } = await import("../../../services/authService.jsx");

    // Create a promise that we control
    let resolveFn;
    authService.update_my_user_profile.mockImplementation(
      () => new Promise((resolve) => (resolveFn = resolve)),
    );

    setup();

    fireEvent.click(screen.getByText("Confirm"));

    // Wait for loader to appear
    await waitFor(() => {
      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    // Resolve the promise to clean up - wrap in waitFor to handle React updates
    await waitFor(() => {
      resolveFn({ data: { preferredLanguage: "fr-ca" } });
    });

    // Wait for the component to finish processing
    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });
  });

  it("handles API error gracefully", async () => {
    const { authService } = await import("../../../services/authService.jsx");

    authService.update_my_user_profile.mockRejectedValueOnce({
      data: {
        message: "NETWORK_ERROR",
      },
    });

    setup();

    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);

    // Wait for API call to be made
    await waitFor(() => {
      expect(authService.update_my_user_profile).toHaveBeenCalled();
    });

    // Verify loader is removed after error
    await waitFor(() => {
      expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    });

    // Verify navigation didn't happen on error
    expect(mockNavigate).not.toHaveBeenCalledWith(
      expect.stringContaining("/success"),
      expect.anything(),
    );
  });

  it("navigates back to profile when cancel is clicked", () => {
    setup();

    fireEvent.click(screen.getByText("Cancel"));

    expect(mockNavigate).toHaveBeenCalledWith("/en/home");
  });
});
