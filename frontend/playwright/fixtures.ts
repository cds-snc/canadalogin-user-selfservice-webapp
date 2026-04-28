import { test as base, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Shared mock data
// ---------------------------------------------------------------------------

export const mockUserProfile = {
  id: "test-user-123",
  active: true,
  details: {
    emailVerified: true,
    lastLogin: "2025-09-08T12:00:00Z",
    lastMFA: "2025-09-08T12:00:00Z",
    twoFactorAuthentication: true,
    pwdChangedTime: "2025-09-08T12:00:00Z",
  },
  emails: [{ value: "test@example.com", type: "primary" }],
  phoneNumbers: [{ value: "+15551234567", type: "mobile" }],
  meta: {
    created: "2025-09-08T12:00:00Z",
    location: "test",
    lastModified: "2025-09-08T12:00:00Z",
    resourceType: "User",
  },
  userName: "test@example.com",
  preferredLanguage: "en",
  name: {
    givenName: "Test",
    familyName: "User",
    formatted: "Test User",
  },
};

export const mockRpInfo = {
  id: "test-rp-id",
  linkName: "Test Service",
  url: "https://test-service.example.com",
  icon: "",
};

export const mockPasswordPolicy = {
  pwdMinLength: 12,
  pwdMaxLength: 256,
};

export const mockMfaFactors = [
  {
    id: "mfa-factor-1",
    type: "smsotp",
    destination: "+15551234567",
    validated: true,
  },
];

// ---------------------------------------------------------------------------
// Helper: intercept all standard backend API calls
// ---------------------------------------------------------------------------

/**
 * Sets up default route intercepts for the backend API so tests run without
 * a real backend.  Individual tests can call `page.route()` afterwards to
 * override specific endpoints.
 *
 * Uses glob patterns (** prefix) so routes match regardless of the
 * backend hostname configured via VITE_BACKEND_API_URL.
 */
export async function mockApiRoutes(page: Page): Promise<void> {
  // Profile — returns authenticated user
  await page.route("**/v1/users/profile**", async (route) => {
    if (route.request().method() === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockUserProfile }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockUserProfile }),
      });
    }
  });

  // Relying-party info
  await page.route("**/v1/users/rp_info**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockRpInfo }),
    });
  });

  // Password policy
  await page.route("**/v1/password/policy**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockPasswordPolicy }),
    });
  });

  // MFA / OTP phone factors (used by useOtpOperations hook)
  await page.route("**/v1/users/otp_factors**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockMfaFactors }),
    });
  });

  // Session-status SSE — return a minimal keep-alive stream
  await page.route("**/v1/auth/session-status**", async (route) => {
    const futureExpire = Math.floor(Date.now() / 1000) + 3600;
    await route.fulfill({
      status: 200,
      contentType: "text/event-stream",
      body: `event: notification\ndata: ${JSON.stringify({ status: "active", expire: futureExpire })}\n\n`,
    });
  });

  // Keep-alive
  await page.route("**/v1/auth/keep-alive**", async (route) => {
    const futureExpire = Math.floor(Date.now() / 1000) + 3600;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { expire: futureExpire } }),
    });
  });

  // Auth login — prevent OIDC redirect by returning a 200
  await page.route("**/v1/auth/login**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<html><body>Mock login — should not reach here</body></html>",
    });
  });

  // Logout
  await page.route("**/v1/auth/logout**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { redirect_url: "/" } }),
    });
  });
}

// ---------------------------------------------------------------------------
// Custom test fixture — every test gets authenticated API mocks automatically
// ---------------------------------------------------------------------------

type AuthFixtures = {
  /** An authenticated page with all standard API routes mocked. */
  authedPage: Page;
};

export const test = base.extend<AuthFixtures>({
  authedPage: async ({ page }, use) => {
    await mockApiRoutes(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
