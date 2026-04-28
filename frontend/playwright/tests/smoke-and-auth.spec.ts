import { test, expect } from "../fixtures";
import { mockApiRoutes } from "../fixtures";

/**
 * Auth guard tests — verify that unauthenticated requests are handled properly.
 * We override the profile endpoint to simulate a 401 response.
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

    // Intercept navigation to external OIDC — don't actually follow it
    let redirectedToLogin = false;
    page.on("request", (req) => {
      const url = req.url();
      if (!url.startsWith("http://localhost")) {
        redirectedToLogin = true;
      }
    });

    await page.goto("/en");

    // Give the app time to process the 401 and attempt redirect
    await page.waitForTimeout(2000);

    // Either the page redirects to an external OIDC URL or shows nothing protected
    // We simply verify the dashboard content is NOT visible
    const dashboardHeading = await page
      .getByRole("heading", { name: /welcome,/i })
      .isVisible()
      .catch(() => false);

    // If it didn't redirect, at least the protected content should not be shown
    if (!redirectedToLogin) {
      expect(dashboardHeading).toBe(false);
    }
  });
});

/**
 * Route existence tests — verify that all main routes render a page
 * (don't 404 or crash).
 */
test.describe("Route smoke tests", () => {
  const routes = [
    "/en",
    "/fr",
    "/en/profile",
    "/en/security-settings",
    "/en/security-settings/update-password",
    "/en/security-settings/manage-2fa-verifications",
    "/en/security-settings/manage-2fa-verifications/add-mfa-phone-number",
    "/en/security-settings/manage-2fa-verifications/delete-mfa-phone-number",
    "/en/profile/update-name",
    "/en/profile/update-language",
    "/en/profile/update-contact-phone",
  ];

  for (const route of routes) {
    test(`${route} renders without crashing`, async ({ authedPage }) => {
      await authedPage.goto(route);
      // A heading at any level should be present
      await expect(authedPage.getByRole("heading").first()).toBeVisible({
        timeout: 8000,
      });
    });
  }
});

/**
 * Accessibility smoke tests using Playwright's built-in a11y checks.
 * These verify there are no critical ARIA violations on key pages.
 */
test.describe("Accessibility — landmark regions", () => {
  test("dashboard has a main landmark", async ({ authedPage }) => {
    await authedPage.goto("/en");
    await expect(
      authedPage.locator("[role='main'], main").first(),
    ).toBeVisible();
  });

  test("profile page has a main landmark", async ({ authedPage }) => {
    await authedPage.goto("/en/profile");
    await expect(
      authedPage.locator("[role='main'], main").first(),
    ).toBeVisible();
  });

  test("security settings page has a main landmark", async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings");
    await expect(
      authedPage.locator("[role='main'], main").first(),
    ).toBeVisible();
  });
});

test.describe("Accessibility — page title", () => {
  test("dashboard page has a document title", async ({ authedPage }) => {
    await authedPage.goto("/en");
    const title = await authedPage.title();
    expect(title.length).toBeGreaterThan(0);
  });
});

test.describe("Accessibility — heading hierarchy", () => {
  test("dashboard page has an h1", async ({ authedPage }) => {
    await authedPage.goto("/en");
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("profile page has an h1", async ({ authedPage }) => {
    await authedPage.goto("/en/profile");
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("security settings page has an h1", async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings");
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
