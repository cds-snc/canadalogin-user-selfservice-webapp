import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router";
import EditEmailAddressPage from "../EditEmailAddressPage";

// Setup test environment for GCDS components
import "../../../setupTests";

// Extend expect with jest-dom matchers
import "@testing-library/jest-dom";

// Mock dependencies
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

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => vi.fn(),
    Navigate: () => null, // Mock Navigate component
  };
});

const renderComponent = () => {
  return render(
    <BrowserRouter>
      <EditEmailAddressPage />
    </BrowserRouter>,
  );
};

describe("EditEmailAddressPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render password verification step initially", () => {
    renderComponent();

    // The component should start on the passwordVerification step
    // Look for the text content using a more flexible approach
    expect(screen.getByText(/To add a phone number/i)).toBeInTheDocument();
    expect(
      screen.getByText(/first enter your current password/i),
    ).toBeInTheDocument();
  });

  it("should have Continue and Cancel buttons", () => {
    renderComponent();

    // Should have Continue and Cancel buttons
    expect(screen.getByText("Continue")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
  });
});
