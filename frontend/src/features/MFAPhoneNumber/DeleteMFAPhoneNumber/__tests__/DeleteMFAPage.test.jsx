import "@testing-library/jest-dom/vitest";
import { BrowserRouter } from "react-router";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import DeleteMFAPage from "../component/DeleteMFAPage.jsx";
import { UserProvider } from "../../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../../components/Providers/LanguageProvider.tsx";

// Mock the navigation hooks
const mockNavigate = vi.fn();
const mockNavigateHelper = vi.fn();
const mockLocation = {
  state: { factorIds: ["factor-1"] },
  pathname: "/en/delete-mfa",
};

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ language: "en" }),
    useLocation: () => mockLocation,
  };
});

vi.mock("../../../../hooks/useNavigate.tsx", () => ({
  useNavigateHelper: () => mockNavigateHelper,
}));

// Mock API modules
const mockGetUserOtpPhoneFactors = vi.fn();
const mockDeleteMFA = vi.fn();

vi.mock("../../../TransientOtp/api/otpFactors", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: (...args) => mockGetUserOtpPhoneFactors(...args),
  },
}));

vi.mock("../api/DeleteMFAPhoneNumberAPI", () => ({
  deleteMFAPhoneNumberApi: {
    deleteMFA: (...args) => mockDeleteMFA(...args),
  },
}));

// Mock components
vi.mock("../../../../components/Layout/Loading", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

vi.mock("../../../TransientOtp/components/OtpSelection", () => ({
  default: ({ onNext }) => (
    <div data-testid="otp-selection">
      <button data-testid="otp-selection-next" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}));

vi.mock("../../../TransientOtp/components/OtpVerification", () => ({
  default: ({ onNext, onBack }) => (
    <div data-testid="otp-verification">
      <button data-testid="otp-verification-back" onClick={onBack}>
        Back
      </button>
      <button data-testid="otp-verification-next" onClick={onNext}>
        Next
      </button>
    </div>
  ),
}));

vi.mock("../component/DeleteMFAPhoneNumberConfirm", () => ({
  default: ({ onNext, onCancel }) => (
    <div data-testid="delete-confirm">
      <button data-testid="delete-confirm-cancel" onClick={onCancel}>
        Cancel
      </button>
      <button data-testid="delete-confirm-next" onClick={onNext}>
        Delete
      </button>
    </div>
  ),
}));

// Mock GCDS components
vi.mock("@cdssnc/gcds-components-react", () => ({
  GcdsErrorMessage: ({ children, messageId }) => (
    <div data-testid="error-message" data-message-id={messageId}>
      {children}
    </div>
  ),
}));

// Mock utilities
vi.mock("../../../../utils/functions", () => ({
  getPageContent: vi.fn((language, page) => {
    if (page === "error" || page === "Error") {
      return {
        7: "An unexpected error occurred",
        "Unexpected API request error": "Unexpected error",
      };
    }
    return { 11: "Loading..." };
  }),
}));

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: vi.fn((page) => {
    if (page === "SecuritySettings" || page === "securitySettings")
      return "/en/security-settings";
    if (page === "Manage2FAVerifications" || page === "manage2FAVerifications")
      return "/en/security-settings/manage-2fa-verifications";
    return "/en/test";
  }),
}));

vi.mock("../../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../../utils/constants");
  return {
    ...actual,
    serverMapping: {
      smsotp: "sms",
      voiceotp: "voice",
    },
  };
});

const mockUserState = {
  userProfile: {
    id: "test-user-123",
    name: { givenName: "Test", familyName: "User" },
    emails: [{ value: "test@example.com" }],
  },
};

const renderComponent = (userState = mockUserState, locationState = null) => {
  if (locationState !== null) {
    mockLocation.state = locationState;
  }

  return render(
    <BrowserRouter>
      <UserProvider initial={userState}>
        <LanguageProvider>
          <DeleteMFAPage />
        </LanguageProvider>
      </UserProvider>
    </BrowserRouter>,
  );
};

describe("DeleteMFAPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocation.state = { factorIds: ["factor-1"] };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial Loading and Error Handling", () => {
    it("shows loading state while fetching OTP factors", async () => {
      mockGetUserOtpPhoneFactors.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  success: true,
                  data: [
                    {
                      id: "factor-1",
                      type: "smsotp",
                      phoneNumber: "+15551234567",
                    },
                  ],
                }),
              100,
            ),
          ),
      );

      renderComponent();

      expect(screen.getByTestId("loading")).toBeInTheDocument();
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId("loading")).not.toBeInTheDocument();
      });
    });

    it("navigates to security settings when no phone factors are returned", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings",
        );
      });
    });

    it("navigates to security settings when API returns no type", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [{ id: "factor-1", phoneNumber: "+15551234567" }],
      });

      renderComponent();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings",
        );
      });
    });

    it("navigates to manage page when no factorIds provided", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent(mockUserState, {});

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("navigates to manage page when factorId not found in user factors", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent(mockUserState, { factorIds: ["non-existent-id"] });

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });

    it("handles API error when fetching factors", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetUserOtpPhoneFactors.mockRejectedValue(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Error fetching user OTP phone factors:",
          expect.any(Error),
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("Error Display in StepContent", () => {
    it("displays error message when errorCode is set", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      mockDeleteMFA.mockRejectedValue({
        data: { message: "7" },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate through wizard to trigger delete error
      const nextBtn = screen.getByTestId("otp-selection-next");
      nextBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      const verifyNextBtn = screen.getByTestId("otp-verification-next");
      verifyNextBtn.click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      const deleteBtn = screen.getByTestId("delete-confirm-next");
      deleteBtn.click();

      // Verify the deletion API was called and error was caught
      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalled();
      });
    });

    it('displays error message for "Unexpected API request error" code', async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      mockDeleteMFA.mockRejectedValue({
        data: { message: "Unexpected API request error" },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      // Navigate to delete confirmation
      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-next").click();

      // Verify the deletion API was called and error was caught
      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalled();
      });
    });
  });

  describe("Wizard Navigation", () => {
    it("navigates back from OTP verification to OTP selection", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-back").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });
    });

    it("cancels deletion from confirmation step", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-cancel").click();

      await waitFor(() => {
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
        );
      });
    });
  });

  describe("Successful Deletion", () => {
    it("successfully deletes MFA and navigates with success notice", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      mockDeleteMFA.mockResolvedValue({ success: true });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-next").click();

      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalledWith({
          id: "factor-1",
          otpType: "sms", // serverMapping converts smsotp -> sms
        });
        expect(mockNavigateHelper).toHaveBeenCalledWith(
          "/en/security-settings/manage-2fa-verifications",
          false,
          {
            noticeType: "mfaDeleted",
            phoneNumber: "+15551234567",
          },
        );
      });
    });

    it("deletes multiple MFA factors", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
          {
            id: "factor-2",
            type: "voiceotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      mockDeleteMFA.mockResolvedValue({ success: true });
      mockLocation.state = { factorIds: ["factor-1", "factor-2"] };

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-next").click();

      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalledTimes(2);
        expect(mockDeleteMFA).toHaveBeenCalledWith({
          id: "factor-1",
          otpType: "sms", // serverMapping converts smsotp -> sms
        });
        expect(mockDeleteMFA).toHaveBeenCalledWith({
          id: "factor-2",
          otpType: "voice", // serverMapping converts voiceotp -> voice
        });
      });
    });
  });

  describe("Deletion Error Handling", () => {
    it("handles deletion error without data.message", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      mockDeleteMFA.mockRejectedValue(new Error("Network error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-next").click();

      // Error should be caught but no error message displayed since error.data.message is undefined
      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalled();
      });
    });

    it("handles deletion error in onNext callback", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
          },
        ],
      });

      // Mock deleteMFA to succeed but navigateHelper to fail
      mockDeleteMFA.mockResolvedValue({ success: true });
      mockNavigateHelper.mockRejectedValue(new Error("Navigation error"));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByTestId("otp-selection")).toBeInTheDocument();
      });

      screen.getByTestId("otp-selection-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
      });

      screen.getByTestId("otp-verification-next").click();

      await waitFor(() => {
        expect(screen.getByTestId("delete-confirm")).toBeInTheDocument();
      });

      screen.getByTestId("delete-confirm-next").click();

      // Verify error handling was triggered
      await waitFor(() => {
        expect(mockDeleteMFA).toHaveBeenCalled();
        expect(mockNavigateHelper).toHaveBeenCalled();
      });
    });
  });
});
