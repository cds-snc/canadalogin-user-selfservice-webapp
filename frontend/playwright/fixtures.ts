import { test as base, type Page, type BrowserContext } from "@playwright/test";

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

export const mockFido2Credentials = [
  {
    id: "passkey-1",
    nickname: "My Phone",
    enabled: true,
    createdAt: "2025-09-08T12:00:00Z",
    rpId: "test-rp-id",
  },
];

// ---------------------------------------------------------------------------
// Reusable helpers: mock common API responses for wizard flows
// ---------------------------------------------------------------------------

/** Mock a successful password verification response */
export async function mockPasswordVerifySuccess(page: Page): Promise<void> {
  await page.route("**/v1/password/verify**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/** Mock a failed password verification response */
export async function mockPasswordVerifyFailure(page: Page): Promise<void> {
  await page.route("**/v1/password/verify**", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: "Invalid credentials",
      }),
    });
  });
}

/** Mock a successful OTP send response */
export async function mockOtpSendSuccess(page: Page): Promise<void> {
  await page.route("**/v1/otp/transient/send**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { trxnId: "txn-test-123" },
      }),
    });
  });
}

/** Mock a successful OTP verify response */
export async function mockOtpVerifySuccess(page: Page): Promise<void> {
  await page.route("**/v1/otp/transient/verify**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/** Mock a failed OTP verify response */
export async function mockOtpVerifyFailure(
  page: Page,
  attemptsRemaining = 3,
): Promise<void> {
  await page.route("**/v1/otp/transient/verify**", async (route) => {
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({
        success: false,
        message: `Invalid code. You have ${attemptsRemaining} attempts remaining.`,
        messageId: "INVALID_OTP",
      }),
    });
  });
}

/** Mock a successful profile update (PATCH or POST to /v1/users/profile) */
export async function mockProfileUpdateSuccess(page: Page): Promise<void> {
  await page.route("**/v1/users/profile**", async (route, request) => {
    if (request.method() === "GET") {
      await route.fallback();
    } else {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: mockUserProfile }),
      });
    }
  });
}

/** Mock profile update with OTP (for phone/email updates) */
export async function mockProfileUpdateWithOtpSuccess(
  page: Page,
): Promise<void> {
  await page.route("**/v1/users/profile/update-with-otp**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockUserProfile }),
    });
  });
}

/** Mock MFA enrollment endpoints (enroll, send, verify) */
export async function mockMfaEnrollmentSuccess(page: Page): Promise<void> {
  await page.route("**/v1/otp/mfa/enroll**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { id: "new-mfa-factor", trxnId: "txn-mfa-enroll" },
      }),
    });
  });
  await page.route("**/v1/otp/mfa/send**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { trxnId: "txn-mfa-send" },
      }),
    });
  });
  await page.route("**/v1/otp/mfa/verify**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/** Mock MFA delete endpoints */
export async function mockMfaDeleteSuccess(page: Page): Promise<void> {
  await page.route("**/v1/otp/mfa/delete**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/** Mock FIDO2 API endpoints */
export async function mockFido2Routes(page: Page): Promise<void> {
  await page.route("**/v1/fido2/user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: mockFido2Credentials }),
    });
  });
  await page.route("**/v1/fido2/attestation/options**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: {
          rp: { name: "CanadaLogin", id: "test-rp" },
          user: { id: "test-user", name: "test@example.com" },
          challenge: "dGVzdC1jaGFsbGVuZ2U",
          pubKeyCredParams: [{ type: "public-key", alg: -7 }],
        },
      }),
    });
  });
  await page.route("**/v1/fido2/attestation/result**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { id: "new-passkey-id", nickname: "My Phone" },
      }),
    });
  });
  await page.route("**/v1/fido2/registration**", async (route) => {
    if (route.request().method() === "DELETE") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else if (route.request().method() === "PUT") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    } else {
      await route.fallback();
    }
  });
  await page.route("**/v1/fido2/metadata/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        description: "Test Authenticator",
        is_known: true,
      }),
    });
  });
}

/** Mock password update endpoints (first-step, second-step, final-step) */
export async function mockPasswordUpdateSuccess(page: Page): Promise<void> {
  await page.route("**/v1/password/update**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        success: true,
        data: { trxnId: "txn-pw-update" },
      }),
    });
  });
}

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
