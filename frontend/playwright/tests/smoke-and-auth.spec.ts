import { test, expect } from "../fixtures";
import { mockApiRoutes } from "../fixtures";

/**
 * Auth guard tests — verify that unauthenticated requests are handled properly.
 */
test.describe("Authentication guard", () => {
  test("unauthenticated user is not shown protected content", async ({
    page,
  }) => {
    // Override profile to return 401 (unauthenticated)
    await page.route("**/v1/users/profile", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false, message: "Unauthorized" }),
      });
    });

    // Mock remaining routes so app doesn't crash on other API calls
    await page.route("**/v1/auth/session-status**", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ success: false }),
      });
    });
    await page.route("**/v1/auth/login**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: "<html><body>Mock OIDC login</body></html>",
      });
    });

    await page.goto("/en");
    await page.waitForTimeout(2000);

    // Protected dashboard content should NOT be visible
    const dashboardVisible = await page
      .getByRole("heading", { name: /welcome/i })
      .isVisible()
      .catch(() => false);
    expect(dashboardVisible).toBe(false);
  });
});

/**
 * Route existence tests — verify that all main routes render without crashing.
 */
test.describe("Route smoke tests", () => {
  const routes = [
    { path: "/en", expectedHeading: /welcome/i },
    { path: "/fr", expectedHeading: /bienvenue/i },
    { path: "/en/profile", expectedHeading: /personal information/i },
    { path: "/en/security-settings", expectedHeading: /security settings/i },
    {
      path: "/en/security-settings/update-password",
      expectedHeading: /first, verify it's you/i,
    },
    {
      path: "/en/security-settings/manage-2fa-verifications",
      expectedHeading: /manage 2-step verification/i,
    },
    {
      path: "/en/security-settings/manage-2fa-verifications/add-mfa-phone-number",
      expectedHeading: /first, verify it's you/i,
    },
    {
      path: "/en/profile/update-name",
      expectedHeading: /edit your name/i,
    },
    {
      path: "/en/profile/update-language",
      expectedHeading: /edit your language preference/i,
    },
    {
      path: "/en/profile/update-contact-phone",
      expectedHeading: /enter a new phone number/i,
    },
    {
      path: "/en/profile/update-email",
      expectedHeading: /first, verify it's you/i,
    },
  ];

  for (const { path, expectedHeading } of routes) {
    test(`${path} renders with correct heading`, async ({ authedPage }) => {
      await authedPage.goto(path);
      await expect(
        authedPage.getByRole("heading", { name: expectedHeading }),
      ).toBeVisible({ timeout: 8000 });
    });
  }
});

/**
 * Accessibility smoke tests — landmarks and heading hierarchy.
 */
test.describe("Accessibility — landmarks", () => {
  const pages = ["/en", "/en/profile", "/en/security-settings"];

  for (const path of pages) {
    test(`${path} has a main landmark and h1`, async ({ authedPage }) => {
      await authedPage.goto(path);
      await expect(
        authedPage.locator("[role='main'], main").first(),
      ).toBeVisible();
      await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }

  test("dashboard page has a document title", async ({ authedPage }) => {
    await authedPage.goto("/en");
    const title = await authedPage.title();
    expect(title.length).toBeGreaterThan(0);
  });
});
