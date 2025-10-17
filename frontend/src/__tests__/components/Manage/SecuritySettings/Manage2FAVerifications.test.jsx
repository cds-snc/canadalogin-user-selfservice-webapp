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
import React from "react";
import { render, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Manage2FAVerifications from "../../../../components/Manage/SecuritySettings/Manage2FAVerifications";

// Simple mocks for dependencies
vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
  useLocation: () => ({ state: null }),
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
  },
}));

vi.mock("../../../../utils/routeHelpers.js", () => ({
  path: () => "/security-settings",
}));

vi.mock("../../../../components/Layout/Loading.jsx", () => ({
  default: ({ text }) => <div data-testid="loading">{text}</div>,
}));

// Mock the API with different responses for each test
vi.mock("../../../../features/TransientOtp/api/otpFactors.jsx", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: vi.fn(),
  },
}));

// Import the mocked module
import { otpFactors } from "../../../../features/TransientOtp/api/otpFactors.jsx";

describe("Manage2FAVerifications Component Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays loading state while fetching verification methods", () => {
    // Mock API call that never resolves to show loading state
    otpFactors.getUserOtpPhoneFactors.mockImplementation(
      () => new Promise(() => {}),
    );

    const { getByTestId } = render(<Manage2FAVerifications />);
    expect(getByTestId("loading")).toBeInTheDocument();
    expect(getByTestId("loading")).toHaveTextContent(
      "Loading verification methods...",
    );
  });

  it("displays single phone with SMS verification method", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "smsotp" }],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("Text message (SMS)")).toBeInTheDocument();
      expect(getByText("Add phone number")).toBeInTheDocument();
    });
  });

  it("displays single phone with both SMS and Voice verification methods", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551234567", type: "smsotp" },
        { phoneNumber: "5551234567", type: "voiceotp" },
      ],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("Text message (SMS)")).toBeInTheDocument();
      expect(getByText("Voice call")).toBeInTheDocument();
    });
  });

  it("displays multiple phone numbers with different verification methods", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551234567", type: "smsotp" },
        { phoneNumber: "5551234567", type: "voiceotp" },
        { phoneNumber: "5559876543", type: "smsotp" },
        { phoneNumber: "5555555555", type: "voiceotp" },
      ],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("5559876543")).toBeInTheDocument();
      expect(getByText("5555555555")).toBeInTheDocument();
    });
  });

  it("displays voice call only verification method", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "voiceotp" }],
    });

    const { getByText, queryByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("Voice call")).toBeInTheDocument();
      expect(queryByText("Text message (SMS)")).not.toBeInTheDocument();
    });
  });

  it("handles unknown verification factor types gracefully", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "unknown_type" }],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("5551234567")).toBeInTheDocument();
      expect(getByText("unknown_type")).toBeInTheDocument();
      // Should still display the phone number even with unknown type
    });
  });

  it("formats long phone numbers correctly", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "15551234567890", type: "smsotp" }],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      // Should display the long number as-is
      expect(getByText("15551234567890")).toBeInTheDocument();
    });
  });

  it("shows remove links when there are multiple different phone numbers", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551111111", type: "smsotp" },
        { phoneNumber: "5552222222", type: "voiceotp" },
        { phoneNumber: "5553333333", type: "smsotp" },
      ],
    });

    const { getAllByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      // Should show remove links for multiple phones
      const removeLinks = getAllByText("Remove");
      expect(removeLinks).toHaveLength(3); // One for each phone number
    });
  });

  it("displays add phone number button when API returns empty data", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [],
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Add phone number")).toBeInTheDocument();
      expect(
        getByText("Manage 2-step verification methods"),
      ).toBeInTheDocument();
    });
  });

  it("displays add phone number button when API returns unsuccessful response", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: false,
      data: null,
    });

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Add phone number")).toBeInTheDocument();
      expect(
        getByText("Manage 2-step verification methods"),
      ).toBeInTheDocument();
    });
  });

  it("displays add phone number button when API throws error", async () => {
    otpFactors.getUserOtpPhoneFactors.mockRejectedValue(
      new Error("Network error"),
    );

    const { getByText } = render(<Manage2FAVerifications />);

    await waitFor(() => {
      expect(getByText("Add phone number")).toBeInTheDocument();
      expect(
        getByText("Manage 2-step verification methods"),
      ).toBeInTheDocument();
    });
  });

  it("displays correct page headings and text content", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "smsotp" }],
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
