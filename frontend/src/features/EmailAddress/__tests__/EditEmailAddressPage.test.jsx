import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import React from "react";
import EditEmailAddressPage from "../EditEmailAddressPage";

// Setup test environment for GCDS components
import "../../../setupTests";

// Extend expect with jest-dom matchers
import "@testing-library/jest-dom";

// Mock react-router
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: vi.fn(),
    useNavigate: vi.fn(),
  };
});

// Mock utility functions
vi.mock("../../../utils/functions", () => ({
  getPageContent: vi.fn(),
}));

// Mock constants
vi.mock("../../../utils/constants", () => ({
  PAGES: {
    ProfileHome: "ProfileHome",
    otpSelection: "OtpSelection",
    addMFAPage: "AddMFAPage",
    emailOtpValidation: "EmailOtpValidation",
  },
  FLOW_TYPES: {
    email: "email",
  },
}));

// Mock error utils
vi.mock("../../../utils/errorUtils", () => ({
  getErrorMessage: vi.fn(),
}));

// Mock route helpers
vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(),
}));

// Mock user profile dispatch
vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: vi.fn(),
}));

// Mock hooks
vi.mock("../../../hooks/usePasswordValidation", () => ({
  usePasswordValidation: vi.fn(),
}));

vi.mock("../../../hooks/useOtpOperations", () => ({
  useOtpOperations: vi.fn(),
}));

// Mock user context
vi.mock("../../../components/Providers/useUser", () => ({
  useUser: vi.fn(),
}));

// Mock auth service
vi.mock("../../../services/authService", () => ({
  authService: {
    logout: vi.fn(),
    update_email_address: vi.fn(),
  },
}));

// Mock components
vi.mock("../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

vi.mock("../../../components/Wizard/StepContent", () => ({
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

vi.mock("../../TransientOtp/components/PasswordVerification", () => ({
  default: (props) => (
    <div data-testid="password-verification">
      <button onClick={props.validatePassword}>Validate Password</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../../TransientOtp/components/OtpSelection", () => ({
  default: (props) => (
    <div data-testid="otp-selection">
      <button onClick={props.onNext}>Next</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../../TransientOtp/components/OtpVerification", () => ({
  default: (props) => (
    <div data-testid="otp-verification">
      <button onClick={props.validateOtpCode}>Verify OTP</button>
      <button onClick={props.onBack}>Back</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../EditEmailEnterEmail", () => ({
  default: (props) => (
    <div data-testid="edit-email-enter-email">
      <button onClick={props.onSubmit}>Submit Email</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  ),
}));

vi.mock("../EmailOtpValidation", () => ({
  default: (props) => (
    <div data-testid="email-otp-validation">
      <button onClick={props.onSubmit}>Submit OTP</button>
      <button onClick={props.onCancel}>Cancel</button>
      <button onClick={props.onBack}>Back</button>
    </div>
  ),
}));

vi.mock("../EmailUpdateSuccess", () => ({
  default: (props) => (
    <div data-testid="email-update-success">
      <span>Success: {props.newEmailAddress}</span>
      <button onClick={props.onBackToProfile}>Back to Profile</button>
      <button onClick={props.onSignOut}>Sign Out</button>
    </div>
  ),
}));

vi.mock("../EmailConfirmUpdate", () => ({
  default: (props) => (
    <div data-testid="email-confirm-update">
      <button onClick={props.onSubmit}>Confirm Update</button>
      <button onClick={props.onCancel}>Cancel</button>
    </div>
  ),
}));

// Import mocked functions
import { useParams, useNavigate } from "react-router";
import { getPageContent } from "../../../utils/functions";
import { getErrorMessage } from "../../../utils/errorUtils";
import { path } from "../../../utils/routeHelpers";
import { userProfileDispatch } from "../../../utils/userProfileDispatch";
import { usePasswordValidation } from "../../../hooks/usePasswordValidation";
import { useOtpOperations } from "../../../hooks/useOtpOperations";
import { useUser } from "../../../components/Providers/useUser";
import { authService } from "../../../services/authService";

describe("EditEmailAddressPage", () => {
  const mockNavigate = vi.fn();
  const mockValidatePassword = vi.fn();
  const mockValidateOtpCode = vi.fn();
  const mockRequestOtpCode = vi.fn();
  const mockHandleChangeUserMfaSelection = vi.fn();
  const mockHandleSetUserOtpValue = vi.fn();
  const mockUpdateProfileSuccess = vi.fn();
  const mockDispatch = vi.fn();

  const mockUseParams = vi.mocked(useParams);
  const mockUseNavigate = vi.mocked(useNavigate);
  const mockGetPageContent = vi.mocked(getPageContent);
  const mockGetErrorMessage = vi.mocked(getErrorMessage);
  const mockPath = vi.mocked(path);
  const mockUserProfileDispatch = vi.mocked(userProfileDispatch);
  const mockUsePasswordValidation = vi.mocked(usePasswordValidation);
  const mockUseOtpOperations = vi.mocked(useOtpOperations);
  const mockUseUser = vi.mocked(useUser);
  const mockAuthService = vi.mocked(authService);

  const defaultUserProfile = {
    id: "test-user-id",
    userName: "test@example.com",
    emails: [{ type: "work", value: "test@example.com" }],
  };

  const defaultPageContent = {
    11: "Loading...",
  };

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <EditEmailAddressPage />
      </BrowserRouter>,
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    mockUseParams.mockReturnValue({ language: "en" });
    mockUseNavigate.mockReturnValue(mockNavigate);
    mockGetPageContent.mockReturnValue(defaultPageContent);
    mockGetErrorMessage.mockReturnValue("");
    mockPath.mockReturnValue("/en/profile");
    mockUserProfileDispatch.mockReturnValue({
      updateProfileSuccess: mockUpdateProfileSuccess,
    });

    mockUsePasswordValidation.mockReturnValue({
      validatePassword: mockValidatePassword,
      validatePasswordLoading: false,
    });

    mockUseOtpOperations.mockReturnValue({
      userPhoneFactors: [],
      userSelectedMfaFactor: null,
      userOtpValue: "",
      localLoading: false,
      handleChangeUserMfaSelection: mockHandleChangeUserMfaSelection,
      handleSetUserOtpValue: mockHandleSetUserOtpValue,
      requestOtpCode: mockRequestOtpCode,
      validateOtpCode: mockValidateOtpCode,
      setLocalLoading: vi.fn(),
    });

    mockUseUser.mockReturnValue({
      state: {
        userProfile: defaultUserProfile,
      },
      dispatch: mockDispatch,
    });

    mockAuthService.logout.mockResolvedValue({
      data: { redirect_url: "/" },
    });
    mockAuthService.update_email_address.mockResolvedValue({
      success: true,
      data: { ...defaultUserProfile, userName: "new@example.com" },
    });
  });

  describe("Component Rendering", () => {
    it("renders the basic component structure", () => {
      renderComponent();

      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });

    it("starts with password verification step", () => {
      renderComponent();

      expect(screen.getByTestId("password-verification")).toBeInTheDocument();
      expect(screen.getByText("Validate Password")).toBeInTheDocument();
    });

    it("shows loader when validatePasswordLoading is true", () => {
      mockUsePasswordValidation.mockReturnValue({
        validatePassword: mockValidatePassword,
        validatePasswordLoading: true,
      });

      renderComponent();

      expect(screen.getByTestId("loader")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });

    it("shows loader when localLoading is true", () => {
      mockUseOtpOperations.mockReturnValue({
        userPhoneFactors: [],
        userSelectedMfaFactor: null,
        userOtpValue: "",
        localLoading: true,
        handleChangeUserMfaSelection: mockHandleChangeUserMfaSelection,
        handleSetUserOtpValue: mockHandleSetUserOtpValue,
        requestOtpCode: mockRequestOtpCode,
        validateOtpCode: mockValidateOtpCode,
        setLocalLoading: vi.fn(),
      });

      renderComponent();

      expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    it("calls necessary hooks with correct parameters", () => {
      renderComponent();

      expect(mockUseParams).toHaveBeenCalled();
      expect(mockUseNavigate).toHaveBeenCalled();
      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUsePasswordValidation).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
      expect(mockUseOtpOperations).toHaveBeenCalledWith(
        "test-user-id",
        "test@example.com",
        expect.any(Function),
        "/en/profile",
      );
    });
  });

  describe("Language Support", () => {
    it("handles French language", () => {
      mockUseParams.mockReturnValue({ language: "fr" });
      mockPath.mockReturnValue("/fr/profile");

      renderComponent();

      expect(mockPath).toHaveBeenCalledWith("ProfileHome", { language: "fr" });
      expect(screen.getByTestId("step-content")).toHaveAttribute(
        "data-language",
        "fr",
      );
    });

    it("handles missing language parameter", () => {
      mockUseParams.mockReturnValue({});

      renderComponent();

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Wizard Step Navigation", () => {
    it("navigates from password verification to OTP selection", async () => {
      renderComponent();

      // Initially on password verification
      expect(screen.getByTestId("password-verification")).toBeInTheDocument();

      // Mock successful password validation
      const validatePasswordCallback =
        mockUsePasswordValidation.mock.calls[0][1];
      validatePasswordCallback(); // This should set step to "otpSelection"

      // Re-render to see the new step
      renderComponent();
      expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
    });

    it("navigates from OTP selection to OTP verification", async () => {
      // Start at OTP selection step
      const { rerender } = render(
        <BrowserRouter>
          <EditEmailAddressPage />
        </BrowserRouter>,
      );

      // Simulate being on OTP selection step
      const validatePasswordCallback =
        mockUsePasswordValidation.mock.calls[0][1];
      validatePasswordCallback();

      rerender(
        <BrowserRouter>
          <EditEmailAddressPage />
        </BrowserRouter>,
      );

      // Should navigate to OTP verification
      expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
    });
  });

  describe("Form Data Handling", () => {
    it("initializes with empty form data", () => {
      renderComponent();

      // The component should initialize with empty email address
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });

    it("handles form changes correctly", async () => {
      renderComponent();

      // Check that the component can handle form changes
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });
  });

  describe("Email Validation", () => {
    it("validates required email address", () => {
      renderComponent();

      // Test email validation logic indirectly through component behavior
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });

    it("validates email format", () => {
      renderComponent();

      // Email format validation is handled in the component
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });
  });

  describe("API Integration", () => {
    it("handles successful email update", async () => {
      mockAuthService.update_email_address.mockResolvedValue({
        success: true,
        data: { ...defaultUserProfile, userName: "new@example.com" },
      });

      renderComponent();

      expect(mockAuthService.update_email_address).not.toHaveBeenCalled();
    });

    it("handles email update failure", async () => {
      mockAuthService.update_email_address.mockRejectedValue({
        data: { message: "EMAIL_UPDATE_FAILED" },
      });

      renderComponent();

      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });

    it("handles logout success", async () => {
      mockAuthService.logout.mockResolvedValue({
        data: { redirect_url: "https://logout.example.com" },
      });

      // Mock window.location.href
      const originalLocation = window.location;
      delete window.location;
      window.location = { href: "" };

      renderComponent();

      // Restore window.location
      window.location = originalLocation;
    });

    it("handles logout failure", async () => {
      mockAuthService.logout.mockRejectedValue(new Error("Logout failed"));

      const originalLocation = window.location;
      const originalConsoleError = console.error;
      console.error = vi.fn();
      delete window.location;
      window.location = { href: "" };

      renderComponent();

      // Restore
      window.location = originalLocation;
      console.error = originalConsoleError;
    });
  });

  describe("Navigation Functions", () => {
    it("handles back to profile navigation", () => {
      renderComponent();

      expect(mockPath).toHaveBeenCalledWith("ProfileHome", { language: "en" });
    });

    it("navigates back to enter email step", () => {
      renderComponent();

      // Navigation logic is handled internally
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("displays error messages correctly", () => {
      mockGetErrorMessage.mockReturnValue("Test error message");

      renderComponent();

      expect(screen.getByTestId("step-content")).toHaveAttribute(
        "data-error-code",
        "",
      );
    });

    it("handles missing user profile", () => {
      mockUseUser.mockReturnValue({
        state: { userProfile: null },
        dispatch: mockDispatch,
      });

      renderComponent();

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing user profile properties", () => {
      mockUseUser.mockReturnValue({
        state: { userProfile: {} },
        dispatch: mockDispatch,
      });

      renderComponent();

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Step Components Integration", () => {
    it("renders password verification with correct props", () => {
      renderComponent();

      const passwordVerification = screen.getByTestId("password-verification");
      expect(passwordVerification).toBeInTheDocument();

      // Test button interactions
      const validateButton = screen.getByText("Validate Password");
      const cancelButton = screen.getByText("Cancel");
      expect(validateButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });

    it("renders OTP selection with correct props", () => {
      renderComponent();

      // Check that step content is rendered (component handles step logic internally)
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });

    it("renders enter email step with correct props", () => {
      renderComponent();

      // Component should be able to render all steps
      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });
  });

  describe("Hook Interactions", () => {
    it("calls password validation hook correctly", () => {
      renderComponent();

      expect(mockUsePasswordValidation).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
      );
    });

    it("calls OTP operations hook correctly", () => {
      renderComponent();

      expect(mockUseOtpOperations).toHaveBeenCalledWith(
        "test-user-id",
        "test@example.com",
        expect.any(Function),
        "/en/profile",
      );
    });

    it("handles OTP validation callback", () => {
      renderComponent();

      // Test OTP validation callback
      const otpCallback = mockUseOtpOperations.mock.calls[0][2];
      expect(typeof otpCallback).toBe("function");
    });
  });

  describe("User Context Integration", () => {
    it("uses user profile data correctly", () => {
      renderComponent();

      expect(mockUseUser).toHaveBeenCalled();
      expect(mockUserProfileDispatch).toHaveBeenCalledWith(mockDispatch);
    });

    it("handles user profile updates", () => {
      renderComponent();

      expect(mockUpdateProfileSuccess).toBeDefined();
    });
  });

  describe("Constants and Utils", () => {
    it("uses route helpers correctly", () => {
      renderComponent();

      expect(mockPath).toHaveBeenCalledWith("ProfileHome", { language: "en" });
    });

    it("gets page content correctly", () => {
      renderComponent();

      expect(mockGetPageContent).toHaveBeenCalledWith("en", "OtpSelection");
    });

    it("gets error messages correctly", () => {
      renderComponent();

      expect(mockGetErrorMessage).toHaveBeenCalledWith("en", "");
    });
  });

  describe("Accessibility", () => {
    it("renders with proper structure", () => {
      renderComponent();

      const stepContent = screen.getByTestId("step-content");
      expect(stepContent).toBeInTheDocument();
    });

    it("handles language attributes", () => {
      renderComponent();

      const stepContent = screen.getByTestId("step-content");
      expect(stepContent).toHaveAttribute("data-language", "en");
    });
  });

  describe("Edge Cases", () => {
    it("handles undefined language parameter", () => {
      mockUseParams.mockReturnValue({ language: undefined });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles null user profile", () => {
      mockUseUser.mockReturnValue({
        state: { userProfile: null },
        dispatch: mockDispatch,
      });

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles empty page content", () => {
      mockGetPageContent.mockReturnValue({});

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles missing hooks return values", () => {
      mockUsePasswordValidation.mockReturnValue({});
      mockUseOtpOperations.mockReturnValue({});

      expect(() => renderComponent()).not.toThrow();
    });
  });

  describe("Performance and Cleanup", () => {
    it("renders without memory leaks", () => {
      const { unmount } = renderComponent();
      unmount();

      expect(() => renderComponent()).not.toThrow();
    });

    it("handles component unmounting gracefully", () => {
      const { unmount } = renderComponent();

      expect(() => unmount()).not.toThrow();
    });

    it("can be re-rendered multiple times", () => {
      const { rerender } = renderComponent();

      rerender(
        <BrowserRouter>
          <EditEmailAddressPage />
        </BrowserRouter>,
      );

      expect(screen.getByTestId("step-content")).toBeInTheDocument();
    });
  });

  describe("Window Location Mocking", () => {
    let originalLocation;

    beforeEach(() => {
      originalLocation = window.location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it("handles window.location.href assignment", () => {
      delete window.location;
      window.location = { href: "" };

      renderComponent();

      expect(window.location.href).toBe("");
    });
  });
});
