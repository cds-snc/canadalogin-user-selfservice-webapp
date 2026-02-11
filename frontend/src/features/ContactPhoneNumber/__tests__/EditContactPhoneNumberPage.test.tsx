import { BrowserRouter } from "react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditContactPhoneNumberPage from "../components/EditContactPhoneNumberPage";
import { UserProvider } from "../../../components/Providers/UserProvider.tsx";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider.tsx";
import "@testing-library/jest-dom/vitest";

// Declare mock functions first
const mockNavigate = vi.fn();
const mockLocation = { state: null };
let mockParams = { language: "en", step: undefined };

// Mock react-router hooks
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => mockParams,
  };
});

// Mock auth service
vi.mock("../../../services/authService.tsx", () => ({
  authService: {
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
    update_my_user_profile: vi.fn(),
    update_phone_with_otp: vi.fn(),
    get_my_user_profile: vi.fn(),
    logout: vi.fn(),
    get_relying_party_info: vi.fn(),
  },
}));

// Mock utility functions
vi.mock("../../../utils/functions.ts", () => ({
  getPageContent: () => ({
    11: "Loading...",
    error: "An error occurred",
  }),
}));

vi.mock("../../../utils/routeHelpers.js", () => ({
  path: vi.fn(() => "/en/profile"),
}));

vi.mock("../../../utils/userProfileDispatch.tsx", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: vi.fn(),
  }),
}));

// Mock constants
vi.mock("../../../utils/constants.ts", async () => {
  const actual = await vi.importActual("../../../utils/constants.ts");
  return {
    ...actual,
    SERVICES: [{ id: 1, title: "Test Service", description: "", url: "#" }],
  };
});

// Mock components
vi.mock("../components/EnterPhoneNumber.tsx", () => ({
  default: ({
    onNext,
    onCancel,
    errorMessage,
    phoneFormData,
    onChangePhoneForm,
  }) => (
    <div data-testid="enter-phone-number">
      <h2>Enter Phone Number</h2>
      {errorMessage && <div data-testid="error">{errorMessage}</div>}
      <input
        data-testid="phone-input"
        value={phoneFormData?.phoneNumber || ""}
        onChange={(e) => onChangePhoneForm?.("phoneNumber", e.target.value)}
      />
      <button data-testid="next-btn" onClick={onNext}>
        Next
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../components/OtpVerification.tsx", () => ({
  default: ({
    onNext,
    onCancel,
    onBack,
    requestNewOtpCode,
    phoneFormData,
    onChangePhoneForm,
  }) => (
    <div data-testid="otp-verification">
      <h2>OTP Verification</h2>
      <input
        data-testid="otp-input"
        value={phoneFormData?.otp || ""}
        onChange={(e) => onChangePhoneForm?.("otp", e.target.value)}
      />
      <button data-testid="verify-btn" onClick={onNext}>
        Verify
      </button>
      <button data-testid="back-btn" onClick={onBack}>
        Back
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
      <button
        data-testid="resend-btn"
        onClick={() => requestNewOtpCode(phoneFormData?.otpType)}
      >
        Resend
      </button>
    </div>
  ),
}));

vi.mock("../components/ConfirmUpdate.tsx", () => ({
  default: ({ onNext, onCancel, phoneFormData }) => (
    <div data-testid="confirm-update">
      <h2>Confirm Update</h2>
      <p>Phone: {phoneFormData?.phoneNumber}</p>
      <button data-testid="confirm-btn" onClick={onNext}>
        Confirm
      </button>
      <button data-testid="cancel-btn" onClick={onCancel}>
        Cancel
      </button>
    </div>
  ),
}));

vi.mock("../components/SuccessfullyUpdated.tsx", () => ({
  default: ({ onNext, phoneFormData }) => (
    <div data-testid="successfully-updated">
      <h2>Successfully Updated</h2>
      <p>New phone: {phoneFormData?.phoneNumber}</p>
      <button data-testid="done-btn" onClick={onNext}>
        Done
      </button>
    </div>
  ),
}));

vi.mock("../../../components/Wizard/StepContent.tsx", () => ({
  default: ({ StepComponent }) => StepComponent,
}));

vi.mock("../../../components/Layout/Loading.tsx", () => ({
  default: ({ text }) => <div data-testid="loader">{text}</div>,
}));

const mockUserState = {
  isLoading: false,
  loadingText: null,
  userData: {
    service: "Test Service",
    language: "en",
    email: "test@example.com",
    id: "test-user-123",
  },
  userProfile: {
    id: "test-user-123",
    userName: "testuser",
    name: {
      givenName: "John",
      familyName: "Doe",
      formatted: "John Doe",
    },
  },
};

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <UserProvider initial={mockUserState}>
      <LanguageProvider>{children}</LanguageProvider>
    </UserProvider>
  </BrowserRouter>
);

describe("EditContactPhoneNumberPage Component", () => {
  let mockAuthService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockLocation.state = null;

    // Reset mockParams to default
    mockParams = { language: "en", step: undefined };

    // Get the mocked auth service
    const { authService } = await import("../../../services/authService.tsx");
    mockAuthService = authService;
  });

  it("renders enter phone step by default", () => {
    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    expect(screen.getByTestId("enter-phone-number")).toBeInTheDocument();
    expect(screen.getByText("Enter Phone Number")).toBeInTheDocument();
  });

  it("handles phone number input changes", () => {
    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });

    expect(phoneInput).toHaveValue("+15551234567");
  });

  it("navigates to OTP verification after successful OTP send", async () => {
    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "test-trxn-id" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    // Enter phone number
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });

    // Click next to send OTP
    const nextBtn = screen.getByTestId("next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(mockAuthService.transientOtpSend).toHaveBeenCalledWith({
        phoneNumber: "+15551234567",
        user_id: "test-user-123",
        otpType: "sms",
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/profile/update-contact-phone/verify-otp",
        { replace: true },
      );
    });
  });

  it("handles OTP send errors", async () => {
    mockAuthService.transientOtpSend.mockRejectedValue({
      data: { message: "Invalid phone number" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "invalid" } });

    const nextBtn = screen.getByTestId("next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId("error")).toHaveTextContent(
        "Invalid phone number",
      );
    });
  });

  it("navigates to confirm step after successful OTP verification", async () => {
    // Start with OTP verification step
    mockParams = {
      language: "en",
      step: "verify-otp",
    };

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    // Enter OTP
    const otpInput = screen.getByTestId("otp-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    // Click verify - in the refactored flow, this just moves to confirm step without API call
    const verifyBtn = screen.getByTestId("verify-btn");
    fireEvent.click(verifyBtn);

    // The verify step now just navigates to confirm-update without calling transientOtpVerify
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/profile/update-contact-phone/confirm-update",
        { replace: true },
      );
    });
  });

  it("completes profile update and navigates to success", async () => {
    // Start with confirm step
    mockParams = {
      language: "en",
      step: "confirm-update",
    };

    mockAuthService.update_phone_with_otp.mockResolvedValue({
      success: true,
      data: { phoneNumbers: [{ value: "+15551234567" }] },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
    });

    const confirmBtn = screen.getByTestId("confirm-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAuthService.update_phone_with_otp).toHaveBeenCalledWith(
        "", // phoneNumber
        "", // otp
        "", // trxnId (initialized as empty string)
        "sms", // otpType
      );
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        "/en/profile/update-contact-phone/success",
        { replace: true },
      );
    });
  });

  it("handles back navigation from OTP verification", async () => {
    mockParams = {
      language: "en",
      step: "verify-otp",
    };

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    const backBtn = screen.getByTestId("back-btn");
    fireEvent.click(backBtn);

    expect(mockNavigate).toHaveBeenCalledWith(
      "/en/profile/update-contact-phone",
      { replace: true },
    );
  });

  it("handles cancel navigation", async () => {
    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    const cancelBtn = screen.getByTestId("cancel-btn");
    fireEvent.click(cancelBtn);

    expect(mockNavigate).toHaveBeenCalledWith("/en/profile");
  });

  it("handles resend OTP functionality", async () => {
    mockParams = {
      language: "en",
      step: "verify-otp",
    };

    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "new-trxn-id" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    const resendBtn = screen.getByTestId("resend-btn");
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockAuthService.transientOtpSend).toHaveBeenCalledWith({
        phoneNumber: "",
        user_id: "test-user-123",
        otpType: "sms",
      });
    });
  });

  it("shows loading state when localLoading is true", async () => {
    mockAuthService.transientOtpSend.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { trxnId: "test" } }), 100),
        ),
    );

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    const nextBtn = screen.getByTestId("next-btn");
    fireEvent.click(nextBtn);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("initializes with state from location", () => {
    const testPhoneData = {
      phoneNumber: "+15551234567",
      otp: "123456",
      otpType: "voice",
    };

    mockLocation.state = {
      phoneFormData: testPhoneData,
      step: "verifyOtp",
    };

    mockParams = {
      language: "en",
      step: "verify-otp",
    };

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
  });

  it("maps URL steps to wizard steps correctly", () => {
    const testCases = [
      { urlStep: undefined, expectedComponent: "enter-phone-number" },
      { urlStep: "verify-otp", expectedComponent: "otp-verification" },
      { urlStep: "confirm-update", expectedComponent: "confirm-update" },
      { urlStep: "success", expectedComponent: "successfully-updated" },
    ];

    testCases.forEach(({ urlStep, expectedComponent }) => {
      mockParams = {
        language: "en",
        step: urlStep,
      };

      const { unmount } = render(
        <TestWrapper>
          <EditContactPhoneNumberPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId(expectedComponent)).toBeInTheDocument();
      unmount();
    });
  });
});
