import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";
import Manage2FAVerifications from "../../../../components/Manage/SecuritySettings/Manage2FAVerifications";

// Simple mocks for dependencies
vi.mock("react-router", () => ({
  useParams: () => ({ language: "en" }),
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
vi.mock("../../../../features/ChangePassword/api/otpFactors.jsx", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: vi.fn(),
  },
}));

// Import the mocked module
import { otpFactors } from "../../../../features/ChangePassword/api/otpFactors.jsx";

describe("Manage2FAVerifications Component Snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches snapshot in loading state", () => {
    // Mock API call that never resolves to show loading state
    otpFactors.getUserOtpPhoneFactors.mockImplementation(
      () => new Promise(() => {}),
    );

    const { container } = render(<Manage2FAVerifications />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with single phone SMS only", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "smsotp" }],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with single phone both SMS and Voice", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551234567", type: "smsotp" },
        { phoneNumber: "5551234567", type: "voiceotp" },
      ],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with multiple phone numbers", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551234567", type: "smsotp" },
        { phoneNumber: "5551234567", type: "voiceotp" },
        { phoneNumber: "5559876543", type: "smsotp" },
        { phoneNumber: "5555555555", type: "voiceotp" },
      ],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with voice call only", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "voiceotp" }],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with unknown factor type", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "5551234567", type: "unknown_type" }],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with long phone number", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [{ phoneNumber: "15551234567890", type: "smsotp" }],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot with three different phone numbers (shows remove links)", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        { phoneNumber: "5551111111", type: "smsotp" },
        { phoneNumber: "5552222222", type: "voiceotp" },
        { phoneNumber: "5553333333", type: "smsotp" },
      ],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot when API returns empty data (should navigate away)", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [],
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot when API returns unsuccessful response", async () => {
    otpFactors.getUserOtpPhoneFactors.mockResolvedValue({
      success: false,
      data: null,
    });

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });

  it("matches snapshot when API throws error", async () => {
    otpFactors.getUserOtpPhoneFactors.mockRejectedValue(
      new Error("Network error"),
    );

    const { container } = render(<Manage2FAVerifications />);

    // Wait for component to update after API call
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(container.firstChild).toMatchSnapshot();
  });
});
