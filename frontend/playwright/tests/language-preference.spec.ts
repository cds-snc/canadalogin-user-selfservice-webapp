import { test, expect, mockProfileUpdateSuccess } from "../fixtures";

// ---------------------------------------------------------------------------
// Edit Language Preference — full flows
// ---------------------------------------------------------------------------
test.describe("Edit Language Preference", () => {
  test("happy path: select language → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-language");

    // Step 1: Edit language — "Edit your language preference"
    await expect(
      authedPage.getByRole("heading", {
        name: /edit your language preference/i,
      }),
    ).toBeVisible();
    await expect(authedPage.getByText(/english/i).first()).toBeVisible();
    await expect(authedPage.getByText(/french/i).first()).toBeVisible();

    // Keep English selected (avoid switching UI to French)
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 2: Confirm — "Are you sure you want to update your language preference?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your language preference/i,
      }),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible();

    // Confirm
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Step 3: Success — "You may need to update your language preference in other places"
    await expect(
      authedPage.getByText(/your language preference has been updated/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });

  test("cancel on edit step returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-language");

    await expect(
      authedPage.getByRole("heading", {
        name: /edit your language preference/i,
      }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("cancel on confirm step returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-language");

    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your language preference/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });

  test("selecting French switches confirm step to French UI", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-language");

    const frenchLabel = authedPage.getByText(/french|français/i).first();
    await frenchLabel.click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step renders with French button
    await expect(
      authedPage.getByRole("button", {
        name: /oui, mettre à jour|yes, update/i,
      }),
    ).toBeVisible({ timeout: 5000 });
  });

  test("'Back to profile' button on success navigates to profile", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-language");
    await authedPage.getByRole("button", { name: /continue/i }).click();
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible({ timeout: 8000 });
    await authedPage.getByRole("button", { name: /back to profile/i }).click();

    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Language toggle (EN ↔ FR)
// ---------------------------------------------------------------------------
test.describe("Language toggle (EN ↔ FR)", () => {
  test("toggle from /en to /fr route", async ({ authedPage }) => {
    await authedPage.goto("/en");

    const langToggle = authedPage.getByRole("link", { name: /français|fr/i });
    await expect(langToggle).toBeVisible();
    await langToggle.click();
    await expect(authedPage).toHaveURL(/\/fr/);
  });

  test("toggle from /fr to /en route", async ({ authedPage }) => {
    await authedPage.goto("/fr");

    const langToggle = authedPage.getByRole("link", {
      name: "English",
      exact: true,
    });
    await expect(langToggle).toBeVisible();
    await langToggle.click();
    await expect(authedPage).toHaveURL(/\/en/);
  });
});
