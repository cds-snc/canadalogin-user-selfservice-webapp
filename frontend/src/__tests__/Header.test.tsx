import React from "react";
import { render, waitFor, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";

import { vi } from "vitest";
import App from "../App";
import { authService } from "../services/authService.jsx";

import { UserProvider } from "../components/Providers/UserProvider";
import { LanguageProvider } from "../components/Providers/LanguageProvider";

// Only mock external dependencies, not the providers we want to test

const langHref = "/fr";
const currentLang = "en";

describe.only("RelyingPartyComponent", () => {
  beforeEach(() => {
    // Mock window.matchMedia for useBreakpoints hook
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it("should fetch and dispatch relying party info if available", async () => {
    const rpInfo = {
      url: "https://example.com",
      linkName: "Example Link",
      icon: "https://example.com/icon.png",
      id: "12345",
    };

    const mockRpid = "existing-rp-id";

    // Mock sessionStorage - initially return null to simulate fresh session
    vi.spyOn(window.sessionStorage, "getItem").mockImplementation(() => null);
    vi.spyOn(window.sessionStorage, "setItem").mockImplementation(() => {});

    // Mock auth service responses
    const mockResponse = { data: { ...rpInfo } };
    vi.spyOn(authService, "get_rp_info").mockResolvedValue(mockResponse);
    vi.spyOn(authService, "get_my_user_profile").mockResolvedValue({
      data: {
        id: "test-user-id",
        userName: "testuser",
        active: true,
      },
    });

    // Render with real providers and URL query parameter to trigger relying party logic
    render(
      <MemoryRouter initialEntries={[`/?rp=${mockRpid}`]}>
        <UserProvider>
          <LanguageProvider>
            <App />
          </LanguageProvider>
        </UserProvider>
      </MemoryRouter>
    );

    // Wait for the relying party API call
    await waitFor(
      () => {
        expect(authService.get_rp_info).toHaveBeenCalledWith(mockRpid);
      },
      { timeout: 3000 }
    );

    // Wait for the breadcrumb to render with relying party info
    await waitFor(() => {
      const breadcrumbItem = screen.getByText(rpInfo.linkName);
      expect(breadcrumbItem).toBeTruthy();
      // The breadcrumb contains the relying party link name
    });

    // Verify the "Return to" link is also present in navigation
    await waitFor(() => {
      const returnLink = screen.getByText(`Return to ${rpInfo.linkName}`);
      expect(returnLink).toBeTruthy();
    });
  });
});
