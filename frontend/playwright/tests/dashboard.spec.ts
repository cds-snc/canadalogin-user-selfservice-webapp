import { test, expect, mockUserProfile } from "../fixtures";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en");
  });

  test("shows welcome message with user's formatted name", async ({
    authedPage,
  }) => {
    await expect(
      authedPage.getByRole("heading", {
        name: `Welcome, ${mockUserProfile.name.formatted}`,
      }),
    ).toBeVisible();
  });

  test("shows Personal information card", async ({ authedPage }) => {
    await expect(authedPage.getByText("Personal information")).toBeVisible();
  });

  test("shows Security settings card", async ({ authedPage }) => {
    await expect(authedPage.getByText("Security settings")).toBeVisible();
  });

  test("root path redirects to /en", async ({ authedPage }) => {
    await authedPage.goto("/");
    await expect(authedPage).toHaveURL(/\/en/);
  });

  test("navigating to /fr shows French dashboard", async ({ authedPage }) => {
    await authedPage.goto("/fr");
    // The heading text for French is rendered by i18n — just assert page loaded
    await expect(authedPage).toHaveURL(/\/fr/);
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Dashboard — navigation", () => {
  test("Personal information card navigates to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en");

    // gcds-card renders an anchor; click the card title link
    const card = authedPage
      .getByRole("link")
      .filter({ hasText: "Personal information" })
      .first();
    await card.click();

    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("Security settings card navigates to security page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en");

    const card = authedPage
      .getByRole("link")
      .filter({ hasText: "Security settings" })
      .first();
    await card.click();

    await expect(authedPage).toHaveURL(/\/en\/security-settings/);
  });
});
