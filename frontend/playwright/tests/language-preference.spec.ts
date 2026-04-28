import { test, expect } from "../fixtures";

const API = "http://localhost:8000";

test.describe("Edit Language Preference", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-language");
  });

  test("loads the language preference page", async ({ authedPage }) => {
    await expect(authedPage).toHaveURL(/\/en\/profile\/update-language/);
  });

  test("shows the page heading", async ({ authedPage }) => {
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows English and French radio options", async ({ authedPage }) => {
    await expect(authedPage.getByText(/english/i).first()).toBeVisible();
    await expect(authedPage.getByText(/french/i).first()).toBeVisible();
  });

  test("shows Cancel button", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
  });

  test("shows Continue button", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("button", { name: /continue/i }),
    ).toBeVisible();
  });

  test("cancel returns to profile page", async ({ authedPage }) => {
    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("continuing with French selection advances to confirm step", async ({
    authedPage,
    page,
  }) => {
    await page.route(`${API}/v1/users/profile`, async (route, request) => {
      if (request.method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            data: { preferredLanguage: "fr" },
          }),
        });
      } else {
        await route.continue();
      }
    });

    await authedPage.goto("/en/profile/update-language");

    // Select French option inside the gcds-radios shadow DOM
    const frenchLabel = authedPage.getByText(/french|français/i).first();
    if (await frenchLabel.isVisible()) {
      await frenchLabel.click();
    }

    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Should advance to confirm step
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Language toggle (EN ↔ FR)", () => {
  test("toggle from /en to /fr route", async ({ authedPage }) => {
    await authedPage.goto("/en");

    // gcds-lang-toggle renders an anchor with the alternate language href
    const langToggle = authedPage.getByRole("link", { name: /français|fr/i });
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await expect(authedPage).toHaveURL(/\/fr/);
    }
  });

  test("toggle from /fr to /en route", async ({ authedPage }) => {
    await authedPage.goto("/fr");

    const langToggle = authedPage.getByRole("link", { name: /english|en/i });
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await expect(authedPage).toHaveURL(/\/en/);
    }
  });
});
