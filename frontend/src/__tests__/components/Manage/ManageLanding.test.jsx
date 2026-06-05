import "@testing-library/jest-dom/vitest";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";

import ManageLanding from "../../../components/Manage/ManageLanding";

const mockUseNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useParams: () => ({ language: "en" }),
    useNavigate: () => mockUseNavigate,
  };
});

vi.mock("../../../components/Manage/ManageDashboard", () => ({
  default: () => <div data-testid="manage-dashboard">Manage Dashboard</div>,
}));

vi.mock("../../../utils/constants", () => ({
  ROUTE_PATTERNS: {
    securitySettings: "/:language/security-settings",
  },
  SESSION_STORAGE_KEYS: {
    passwordChangeRedirectToSecurity: "password_change_redirect_to_security",
  },
}));

describe("ManageLanding", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  it("renders ManageDashboard when password-change redirect flag is absent", () => {
    render(<ManageLanding />);

    expect(screen.getByTestId("manage-dashboard")).toBeInTheDocument();
    expect(mockUseNavigate).not.toHaveBeenCalled();
  });

  it("redirects directly to SecuritySettings and clears flag when present", async () => {
    sessionStorage.setItem("password_change_redirect_to_security", "true");

    render(<ManageLanding />);

    await waitFor(() => {
      expect(mockUseNavigate).toHaveBeenCalledWith("/en/security-settings", {
        replace: true,
      });
    });
    expect(screen.queryByTestId("manage-dashboard")).not.toBeInTheDocument();
    expect(
      sessionStorage.getItem("password_change_redirect_to_security"),
    ).toBeNull();
  });
});
