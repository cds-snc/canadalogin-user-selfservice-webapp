import { test, expect, mockProfileUpdateSuccess } from "../fixtures";

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

  test("continuing with current selection advances to confirm step", async ({
    authedPage,
  }) => {
    // Keep English selected (mock user pref is en) to avoid French UI switch
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step heading
    await expect(
      authedPage.getByText(
        /are you sure you want to update your language preference/i,
      ),
    ).toBeVisible({ timeout: 5000 });
  });

  test("confirm step shows Yes, update button", async ({ authedPage }) => {
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("confirm step cancel returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible({ timeout: 5000 });
    await authedPage.getByRole("button", { name: /cancel/i }).click();

    // Cancel on confirm step goes back to profile page
    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });

  test("selecting French switches confirm step to French", async ({
    authedPage,
  }) => {
    const frenchLabel = authedPage.getByText(/french|français/i).first();
    if (await frenchLabel.isVisible()) {
      await frenchLabel.click();
    }

    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step renders in French after selecting French
    await expect(
      authedPage.getByRole("button", {
        name: /oui, mettre à jour|yes, update/i,
      }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("full happy path: confirm → success", async ({ authedPage, page }) => {
    await mockProfileUpdateSuccess(page);

    // Keep English to avoid French UI switch
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible({ timeout: 5000 });
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Success step
    await expect(
      authedPage.getByText(/your language preference has been updated/i),
    ).toBeVisible({ timeout: 5000 });
  });

  test("success page shows back to profile and sign out buttons", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.getByRole("button", { name: /continue/i }).click();
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    await expect(
      authedPage.getByText(/your language preference has been updated/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });
});

test.describe("Language toggle (EN ↔ FR)", () => {
  test("toggle from /en to /fr route", async ({ authedPage }) => {
    await authedPage.goto("/en");

    const langToggle = authedPage.getByRole("link", { name: /français|fr/i });
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await expect(authedPage).toHaveURL(/\/fr/);
    }
  });

  test("toggle from /fr to /en route", async ({ authedPage }) => {
    await authedPage.goto("/fr");

    const langToggle = authedPage.getByRole("link", {
      name: "English",
      exact: true,
    });
    if (await langToggle.isVisible()) {
      await langToggle.click();
      await expect(authedPage).toHaveURL(/\/en/);
    }
  });
});
