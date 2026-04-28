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
    await expect(
      authedPage.getByRole("main").getByText("Personal information"),
    ).toBeVisible();
  });

  test("shows Security settings card", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("main").getByText("Security settings"),
    ).toBeVisible();
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
    // Click the card title link (the nav items are not links)
    await authedPage
      .getByRole("link", { name: "Personal information", exact: true })
      .click();

    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("Security settings card navigates to security page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en");

    await authedPage
      .getByRole("link", { name: "Security settings", exact: true })
      .click();

    await expect(authedPage).toHaveURL(/\/en\/security-settings/);
  });
});
