import { BrowserRouter } from "react-router";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EditContactPhoneNumberPage from "../components/EditContactPhoneNumberPage.jsx";
import { UserProvider } from "../../../components/Providers/UserProvider";
import { LanguageProvider } from "../../../components/Providers/LanguageProvider";
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
vi.mock("../../../services/authService", () => ({
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
vi.mock("../../../utils/functions", () => ({
  getPageContent: () => ({
    11: "Loading...",
    error: "An error occurred",
  }),
}));

vi.mock("../../../utils/routeHelpers", () => ({
  path: vi.fn(() => "/en/profile"),
}));

vi.mock("../../../utils/userProfileDispatch", () => ({
  userProfileDispatch: () => ({
    updateProfileSuccess: vi.fn(),
  }),
}));

// Mock constants
vi.mock("../../../utils/constants", async () => {
  const actual = await vi.importActual("../../../utils/constants");
  return {
    ...actual,
    SERVICES: [{ id: 1, title: "Test Service", description: "", url: "#" }],
  };
});

// Mock components
vi.mock("../components/EnterPhoneNumber.jsx", () => ({
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

vi.mock("../components/OtpVerification.jsx", () => ({
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

vi.mock("../components/ConfirmUpdate.jsx", () => ({
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

vi.mock("../components/SuccessfullyUpdated.jsx", () => ({
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

vi.mock("../../../components/Wizard/StepContent", () => ({
  default: ({ StepComponent }) => StepComponent,
}));

vi.mock("../../../components/Layout/Loading", () => ({
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
    const { authService } = await import("../../../services/authService");
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

  it("shows OTP verification after successful OTP send", async () => {
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
        destination: "+15551234567",
        user_id: "test-user-123",
        otpType: "sms",
      });
    });

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
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

  it("shows confirm step after OTP verification", async () => {
    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "test-trxn-id" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    // Enter phone number and send OTP
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });
    const nextBtn = screen.getByTestId("next-btn");
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    // Enter OTP
    const otpInput = screen.getByTestId("otp-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });

    // Click verify - moves to confirm step without API call
    const verifyBtn = screen.getByTestId("verify-btn");
    fireEvent.click(verifyBtn);

    await waitFor(() => {
      expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
    });
  });

  it("completes profile update and shows success", async () => {
    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "test-trxn-id" },
    });

    mockAuthService.update_phone_with_otp.mockResolvedValue({
      success: true,
      data: { phoneNumbers: [{ value: "+15551234567" }] },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    // Step 1: Enter phone
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });
    fireEvent.click(screen.getByTestId("next-btn"));

    // Step 2: Verify OTP
    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });
    const otpInput = screen.getByTestId("otp-input");
    fireEvent.change(otpInput, { target: { value: "123456" } });
    fireEvent.click(screen.getByTestId("verify-btn"));

    // Step 3: Confirm update
    await waitFor(() => {
      expect(screen.getByTestId("confirm-update")).toBeInTheDocument();
    });
    const confirmBtn = screen.getByTestId("confirm-btn");
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(mockAuthService.update_phone_with_otp).toHaveBeenCalledWith(
        "+15551234567",
        "123456",
        "test-trxn-id",
        "sms",
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("successfully-updated")).toBeInTheDocument();
    });
  });

  it("handles back navigation from OTP verification", async () => {
    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "test-trxn-id" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    // Navigate to OTP step
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });
    fireEvent.click(screen.getByTestId("next-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    const backBtn = screen.getByTestId("back-btn");
    fireEvent.click(backBtn);

    await waitFor(() => {
      expect(screen.getByTestId("enter-phone-number")).toBeInTheDocument();
    });

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
    mockAuthService.transientOtpSend.mockResolvedValue({
      data: { trxnId: "test-trxn-id" },
    });

    render(
      <TestWrapper>
        <EditContactPhoneNumberPage />
      </TestWrapper>,
    );

    // Navigate to OTP step
    const phoneInput = screen.getByTestId("phone-input");
    fireEvent.change(phoneInput, { target: { value: "+15551234567" } });
    fireEvent.click(screen.getByTestId("next-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("otp-verification")).toBeInTheDocument();
    });

    // Clear previous calls
    mockAuthService.transientOtpSend.mockClear();

    // Resend OTP
    const resendBtn = screen.getByTestId("resend-btn");
    fireEvent.click(resendBtn);

    await waitFor(() => {
      expect(mockAuthService.transientOtpSend).toHaveBeenCalledWith({
        destination: "+15551234567",
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
});
