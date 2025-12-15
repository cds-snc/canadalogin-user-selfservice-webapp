import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrowserRouter } from "react-router-dom";
import EditEmailAddressPage from "../EditEmailAddressPage";
import { authService } from "../../../services/authService";

// Mock the authService
vi.mock("../../../services/authService", () => ({
  authService: {
    update_email_address: vi.fn(),
    logout: vi.fn(),
  },
}));

// Mock other dependencies
vi.mock("../../../components/Providers/useUser", () => ({
  useUser: () => ({
    state: {
      userProfile: {
        id: "test-user-id",
        userName: "old-email@example.com",
        emails: [{ type: "work", value: "old-email@example.com" }],
      },
    },
    userDispatch: vi.fn(),
  }),
}));

vi.mock("../../../hooks/usePasswordValidation", () => ({
  usePasswordValidation: () => ({
    validatePassword: vi.fn(),
    validatePasswordLoading: false,
  }),
}));

vi.mock("../../../hooks/useOtpOperations", () => ({
  useOtpOperations: () => ({
    userPhoneFactors: [],
    userSelectedMfaFactor: null,
    userOtpValue: "",
    localLoading: false,
    handleChangeUserMfaSelection: vi.fn(),
    handleSetUserOtpValue: vi.fn(),
    requestOtpCode: vi.fn(),
    validateOtpCode: vi.fn(),
  }),
}));

vi.mock("react-router", () => ({
  ...vi.importActual("react-router"),
  useParams: () => ({ language: "en" }),
  useNavigate: () => vi.fn(),
}));

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <EditEmailAddressPage />
    </BrowserRouter>,
  );
};

describe("EditEmailAddressPage - handleEnterEmailSubmit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should successfully update email address when valid email is provided", async () => {
    const mockResponse = {
      success: true,
      data: {
        id: "test-user-id",
        userName: "new-email@example.com",
        emails: [{ type: "work", value: "new-email@example.com" }],
      },
    };

    authService.update_email_address.mockResolvedValue(mockResponse);

    renderComponent();

    // The component should start on the enterEmail step
    expect(
      screen.getByRole("heading", { name: /enter a new email address/i }),
    ).toBeInTheDocument();

    // Enter a new email address
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "new-email@example.com");

    // Click submit button
    const submitButton = screen.getByRole("button", { name: /continue/i });
    await userEvent.click(submitButton);

    // Verify API was called with correct parameters
    await waitFor(() => {
      expect(authService.update_email_address).toHaveBeenCalledWith(
        "new-email@example.com",
      );
    });
  });

  it("should show error when invalid email format is provided", async () => {
    renderComponent();

    // Enter invalid email
    const emailInput = screen.getByLabelText(/email/i);
    await userEvent.type(emailInput, "invalid-email");

    // Click submit button
    const submitButton = screen.getByRole("button", { name: /continue/i });
    await userEvent.click(submitButton);

    // Should not call the API
    expect(authService.update_email_address).not.toHaveBeenCalled();
  });

  it("should show error when empty email is provided", async () => {
    renderComponent();

    // Click submit button without entering email
    const submitButton = screen.getByRole("button", { name: /continue/i });
    await userEvent.click(submitButton);

    // Should not call the API
    expect(authService.update_email_address).not.toHaveBeenCalled();
  });
});
