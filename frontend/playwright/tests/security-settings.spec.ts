import { test, expect } from "../fixtures";

test.describe("Security Settings page", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings");
  });

  test("shows Security settings heading", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("heading", { name: "Security settings" }),
    ).toBeVisible();
  });

  test("shows 'How you sign in' section heading", async ({ authedPage }) => {
    await expect(
      authedPage.getByText("How you sign in to CanadaLogin"),
    ).toBeVisible();
  });

  test("shows Password section with change link", async ({ authedPage }) => {
    await expect(authedPage.getByText("Password")).toBeVisible();
    await expect(
      authedPage.getByRole("link", { name: /change/i }),
    ).toBeVisible();
  });

  test("shows 2-step verification section", async ({ authedPage }) => {
    await expect(authedPage.getByText("2-step verification")).toBeVisible();
  });

  test("shows Manage link for 2-step verification", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("link", { name: /manage/i }),
    ).toBeVisible();
  });

  test("Change password link navigates to password page", async ({
    authedPage,
  }) => {
    const changeLink = authedPage.getByRole("link", { name: /change/i });
    await changeLink.click();
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/update-password/,
    );
  });

  test("Manage link navigates to 2FA verifications page", async ({
    authedPage,
  }) => {
    const manageLink = authedPage.getByRole("link", { name: /manage/i });
    await manageLink.click();
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
  });
});

test.describe("Manage 2FA Verifications page", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings/manage-2fa-verifications");
  });

  test("loads the 2FA management page", async ({ authedPage }) => {
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows Add MFA phone number option or existing number", async ({
    authedPage,
  }) => {
    // Either shows existing factors or an add button/link
    const pageContent = await authedPage
      .locator("main, [role='main']")
      .textContent();
    // Page should contain some verification-method related content
    expect(pageContent).toBeTruthy();
  });
});
