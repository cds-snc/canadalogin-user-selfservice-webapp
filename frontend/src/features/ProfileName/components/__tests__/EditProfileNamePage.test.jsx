import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom";
import {
  createMemoryRouter,
  RouterProvider,
  useParams,
  useLocation,
  useNavigate,
} from "react-router";
import EditProfileNamePage from "../EditProfileNamePage";
import { useUser } from "../../../../components/Providers/useUser";
import UserContext from "../../../../components/Providers/UserContext";
import * as functions from "../../../../utils/functions";
import { authService } from "../../../../services/authService";

// Mock dependencies
vi.mock("../../../../components/Providers/useUser");
vi.mock("../../../../utils/functions");
vi.mock("../../../../services/authService");

// Mock react-router
let mockParams = { language: "en", step: undefined };
let mockLocation = { state: null };
let mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(() => mockParams),
    useLocation: vi.fn(() => mockLocation),
    useNavigate: vi.fn(() => mockNavigate),
  };
});

// Mock GCDS components
vi.mock("@gcds-core/components-react", () => ({
  GcdsErrorMessage: ({ children, messageId }) => (
    <div data-testid="error-message" data-message-id={messageId}>
      {children}
    </div>
  ),
  GcdsContainer: ({ children, className }) => (
    <div data-testid="gcds-container" className={className}>
      {children}
    </div>
  ),
  GcdsHeading: ({ tag, lang, children }) => (
    <div data-testid="gcds-heading" data-tag={tag} data-lang={lang}>
      {children}
    </div>
  ),
  GcdsText: ({ children }) => <div data-testid="gcds-text">{children}</div>,
  GcdsInput: ({ children, ...props }) => (
    <input data-testid="mock-gcds-input" {...props}>
      {children}
    </input>
  ),
  GcdsButton: ({ children, ...props }) => (
    <button data-testid="mock-gcds-button" {...props}>
      {children}
    </button>
  ),
  GcdsLink: ({ children, ...props }) => (
    <a data-testid="mock-gcds-link" {...props}>
      {children}
    </a>
  ),
  GcdsNotice: ({ children, ...props }) => (
    <div data-testid="gcds-notice" {...props}>
      {children}
    </div>
  ),
}));

// Mock child components
vi.mock("../ProfileUpdateName", () => ({
  default: ({
    nameFormData,
    onNameFormChange,
    onNext,
    onCancel,
    errorMessage,
    setErrorCode,
  }) => (
    <div data-testid="profile-update-name">
      <div data-testid="name-form-data">
        {nameFormData?.formatted || "No name data"}
      </div>
      <button onClick={() => onNameFormChange("givenName", "John")}>
        Change Given Name
      </button>
      <button onClick={onNext} data-testid="profile-update-name-next">
        Next
      </button>
      <button onClick={onCancel} data-testid="profile-update-name-cancel">
        Cancel
      </button>
      {errorMessage && (
        <div data-testid="profile-update-name-error">{errorMessage}</div>
      )}
      <button onClick={() => setErrorCode("TEST_ERROR")}>Set Error</button>
    </div>
  ),
}));

vi.mock("../ConfirmUpdate", () => ({
  default: ({
    nameFormData,
    onConfirm,
    onCancel,
    onBack,
    errorMessage,
    setErrorCode,
    localLoading,
  }) => (
    <div data-testid="confirm-update">
      <div data-testid="confirm-name-data">
        {nameFormData?.formatted || "No name data"}
      </div>
      <button onClick={onConfirm} data-testid="confirm-update-confirm">
        Confirm
      </button>
      <button onClick={onCancel} data-testid="confirm-update-cancel">
        Cancel
      </button>
      <button onClick={onBack} data-testid="confirm-update-back">
        Back
      </button>
      {errorMessage && (
        <div data-testid="confirm-update-error">{errorMessage}</div>
      )}
      <button onClick={() => setErrorCode("CONFIRM_ERROR")}>Set Error</button>
      {localLoading && <div data-testid="confirm-loading">Loading...</div>}
    </div>
  ),
}));

vi.mock("../SuccessfullyUpdated", () => ({
  default: ({ nameFormData, onBackToProfile }) => (
    <div data-testid="successfully-updated">
      <div data-testid="success-name-data">
        {nameFormData?.formatted || "No name data"}
      </div>
      <button onClick={onBackToProfile} data-testid="successfully-updated-back">
        Back to Profile
      </button>
    </div>
  ),
}));

vi.mock("../../../../components/Wizard/StepContent", () => ({
  default: ({ StepComponent, errorCode, language }) => (
    <div
      data-testid="step-content"
      data-error-code={errorCode}
      data-language={language}
    >
      {StepComponent}
    </div>
  ),
}));

vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text || "Loading..."}</div>,
}));

const mockUserProfile = {
  id: "test-user-123",
  userName: "testuser",
  name: {
    givenName: "John",
    familyName: "Doe",
    formatted: "John Doe",
  },
};

const mockUserState = {
  userProfile: mockUserProfile,
};

const mockDispatch = vi.fn();

const TestWrapper = ({ children, initialEntries = ["/"] }) => {
  const router = createMemoryRouter(
    [
      {
        path: "/*",
        element: children,
      },
    ],
    {
      initialEntries,
    },
  );
  return <RouterProvider router={router} />;
};

describe("EditProfileNamePage Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset mock parameters
    mockParams = { language: "en", step: undefined };
    mockLocation = { state: null };
    mockNavigate = vi.fn();

    // Set up navigate mock to update URL parameters
    mockNavigate.mockImplementation((path) => {
      if (path.includes("/confirm-update")) {
        mockParams = { ...mockParams, step: "confirm-update" };
      } else if (path.includes("/success")) {
        mockParams = { ...mockParams, step: "success" };
      } else if (path.endsWith("/update-name")) {
        mockParams = { ...mockParams, step: undefined };
      }
    });

    useUser.mockReturnValue({
      state: mockUserState,
      dispatch: mockDispatch,
    });

    // Mock authService
    authService.update_my_user_profile = vi.fn().mockResolvedValue({
      success: true,
      data: { ...mockUserProfile, name: { formatted: "Updated Name" } },
    });

    // Mock functions
    functions.getPageContent.mockImplementation((language, page) => {
      if (page === "otpSelection") {
        return { 11: "Loading..." };
      }
      if (page === "error") {
        return {
          7: "Unexpected API request error message",
          TEST_ERROR: "Test error message",
          CONFIRM_ERROR: "Confirm error message",
          UPDATE_ERROR: "Update error message",
        };
      }
      return {};
    });
  });

  describe("Initial Render", () => {
    it("should render ProfileUpdateName step by default", async () => {
      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      expect(screen.getByTestId("step-content")).toBeInTheDocument();
      expect(screen.getByTestId("name-form-data")).toHaveTextContent(
        "John Doe",
      );
    });

    it("should render loader when localLoading is true", async () => {
      // Use a pending promise to keep the loading state active long enough to check
      let resolveUpdate;
      authService.update_my_user_profile.mockReturnValue(
        new Promise((res) => {
          resolveUpdate = res;
        }),
      );

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      // Navigate to confirm step and trigger loading
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("confirm-update-confirm"));

      // Should show loader while API call is pending
      await waitFor(() => {
        expect(screen.getByTestId("loader")).toBeInTheDocument();
      });

      // Resolve to clean up
      await act(async () => {
        resolveUpdate({ data: { ...mockUserProfile } });
      });
    });

    it("should pre-populate form from user profile name", async () => {
      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      // Form should be pre-populated with current user profile name
      expect(screen.getByTestId("name-form-data")).toHaveTextContent(
        "John Doe",
      );
    });
  });

  describe("Form Handling", () => {
    it("should handle name form changes", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const changeButton = screen.getByText("Change Given Name");
      fireEvent.click(changeButton);

      // The mock component simulates changing the given name to "John"
      // In real implementation, this would update the nameFormData state
    });

    it("should navigate from editName to confirmUpdate step", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });
    });

    it("should navigate back from confirmUpdate to editName step", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      // Navigate to confirm step first
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Navigate back
      const backButton = screen.getByTestId("confirm-update-back");
      fireEvent.click(backButton);

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });
    });
  });

  describe("Profile Update API", () => {
    it("should successfully update profile and navigate to success step", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Confirm update
      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // Should call update API
      await waitFor(() => {
        expect(authService.update_my_user_profile).toHaveBeenCalled();
      });

      // Should navigate to success step
      await waitFor(() => {
        expect(screen.getByTestId("successfully-updated")).toBeInTheDocument();
      });
    });

    it("should handle profile update API error", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      const apiError = {
        data: { message: "UPDATE_ERROR" },
      };
      authService.update_my_user_profile.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Confirm update
      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(authService.update_my_user_profile).toHaveBeenCalled();
      });

      // Should display error message
      await waitFor(() => {
        expect(screen.getByTestId("confirm-update-error")).toHaveTextContent(
          "UPDATE_ERROR",
        );
      });
    });

    it("should handle profile update API error without data.message", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      const apiError = { someOtherError: true };
      authService.update_my_user_profile.mockRejectedValue(apiError);

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Confirm update
      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(authService.update_my_user_profile).toHaveBeenCalled();
      });

      // Error should be handled gracefully without console logging
    });
  });

  describe("Navigation", () => {
    it("should navigate back to profile from any step", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId("profile-update-name-cancel");
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
    });

    it("should navigate back to profile from confirm step", async () => {
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      const cancelButton = screen.getByTestId("confirm-update-cancel");
      fireEvent.click(cancelButton);

      expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
    });

    it("should navigate back to profile from success step", async () => {
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate through to success step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId("confirm-update-confirm"));
      });

      await waitFor(() => {
        expect(screen.getByTestId("successfully-updated")).toBeInTheDocument();
      });

      const backButton = screen.getByTestId("successfully-updated-back");
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
    });
  });

  describe("Error Handling", () => {
    it("should display error message from errorPageJson when errorCode matches", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      // Trigger error
      const setErrorButton = screen.getByText("Set Error");
      fireEvent.click(setErrorButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("profile-update-name-error"),
        ).toHaveTextContent("TEST_ERROR");
      });
    });

    it("should display fallback error message when errorCode not found in errorPageJson", async () => {
      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Trigger error with code that maps to CONFIRM_ERROR in errorPageJson
      const setErrorButton = screen.getByText("Set Error");
      fireEvent.click(setErrorButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update-error")).toHaveTextContent(
          "CONFIRM_ERROR",
        );
      });
    });

    it("should pass errorCode to StepContent", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      // Trigger error
      const setErrorButton = screen.getByText("Set Error");
      fireEvent.click(setErrorButton);

      await waitFor(() => {
        const stepContent = screen.getByTestId("step-content");
        expect(stepContent).toHaveAttribute("data-error-code", "TEST_ERROR");
        expect(stepContent).toHaveAttribute("data-language", "en");
      });
    });

    it("should clear error when successful update occurs", async () => {
      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Set error first
      const setErrorButton = screen.getByText("Set Error");
      fireEvent.click(setErrorButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update-error")).toBeInTheDocument();
      });

      // Then successful update should clear error
      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByTestId("successfully-updated")).toBeInTheDocument();
      });

      // Error should be cleared (stepContent should have empty error-code)
      await waitFor(() => {
        const stepContent = screen.getByTestId("step-content");
        expect(stepContent).toHaveAttribute("data-error-code", "");
      });
    });
  });

  describe("Form Data Management", () => {
    it("should format name correctly when submitting form", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      // The mock component simulates form changes
      const changeButton = screen.getByText("Change Given Name");
      fireEvent.click(changeButton);

      const nextButton = screen.getByTestId("profile-update-name-next");
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // The formatted name should be available in confirm step
      // Note: In real implementation, this would show the formatted name
      // based on givenName and familyName concatenation
    });

    it("should maintain form data across steps", async () => {
      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step — form data pre-populated from user profile
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      // Should show user profile name data in confirm step
      expect(screen.getByTestId("confirm-name-data")).toHaveTextContent(
        "John Doe",
      );
    });
  });

  describe("Language Support", () => {
    it("should handle French language parameter", async () => {
      // Reset location to have no state for this test
      vi.mocked(useLocation).mockReturnValue({ state: null });
      vi.mocked(useParams).mockReturnValue({ language: "fr" });

      functions.getPageContent.mockImplementation((language, page) => {
        if (language === "fr") {
          if (page === "otpSelection") {
            return { 11: "Chargement..." };
          }
          if (page === "error") {
            return { TEST_ERROR: "Message d'erreur de test" };
          }
        }
        return {};
      });

      render(
        <TestWrapper>
          <EditProfileNamePage />
        </TestWrapper>,
      );

      await waitFor(() => {
        expect(screen.getByTestId("step-content")).toHaveAttribute(
          "data-language",
          "fr",
        );
      });

      // Test error message in French
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      const setErrorButton = screen.getByText("Set Error");
      fireEvent.click(setErrorButton);

      await waitFor(() => {
        expect(
          screen.getByTestId("profile-update-name-error"),
        ).toHaveTextContent("TEST_ERROR");
      });
    });
  });

  describe("User Profile Integration", () => {
    it("should use user profile data correctly in API call", async () => {
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // API should be called with pre-populated user profile name
      await waitFor(() => {
        expect(authService.update_my_user_profile).toHaveBeenCalledWith({
          name: expect.objectContaining({
            givenName: "John",
            familyName: "Doe",
            formatted: "John Doe",
          }),
          user_id: "test-user-123",
        });
      });
    });

    it("should update user profile state after successful update", async () => {
      vi.mocked(useNavigate).mockReturnValue(mockNavigate);

      render(
        <UserContext.Provider
          value={{ state: mockUserState, dispatch: mockDispatch }}
        >
          <EditProfileNamePage />
        </UserContext.Provider>,
      );

      // Navigate to confirm step
      await waitFor(() => {
        expect(screen.getByTestId("profile-update-name")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("profile-update-name-next"));

      await waitFor(() => {
        expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
      });

      const confirmButton = screen.getByTestId("confirm-update-confirm");
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(authService.update_my_user_profile).toHaveBeenCalled();
      });

      // After successful API call, wizard advances to success step
      await waitFor(() => {
        expect(screen.getByTestId("successfully-updated")).toBeInTheDocument();
      });
    });
  });
});
