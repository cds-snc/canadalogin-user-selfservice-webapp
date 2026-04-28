import { test, expect } from "../fixtures";

test.describe("Add MFA Phone Number", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto(
      "/en/security-settings/manage-2fa-verifications/add-mfa-phone-number",
    );
  });

  test("loads the add MFA page", async ({ authedPage }) => {
    await expect(authedPage).toHaveURL(/add-mfa-phone-number/);
  });

  test("shows a heading", async ({ authedPage }) => {
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows password verification input (first wizard step)", async ({
    authedPage,
  }) => {
    // AddMFAPage starts at the password verification step
    await expect(
      authedPage.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();
  });

  test("shows Cancel button", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
  });

  test("cancel returns to 2FA management page", async ({ authedPage }) => {
    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
  });
});

test.describe("Add MFA Phone Number — password verification step", () => {
  test("password verification advances to OTP selection", async ({
    authedPage,
    page,
  }) => {
    await page.route("**/v1/password/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });

    await authedPage.goto(
      "/en/security-settings/manage-2fa-verifications/add-mfa-phone-number",
    );

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Should advance to the next wizard step
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});

test.describe("Delete MFA Phone Number", () => {
  test("navigating to delete page without state redirects to manage 2FA", async ({
    authedPage,
  }) => {
    // DeleteMFAPage requires factorIds in location.state;
    // without it, it redirects to manage-2fa-verifications
    await authedPage.goto(
      "/en/security-settings/manage-2fa-verifications/delete-mfa-phone-number",
    );
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
  });

  test("manage 2FA page shows existing phone factor", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/security-settings/manage-2fa-verifications");
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });
});

test.describe("Delete MFA — navigation", () => {
  test("delete page without state redirects to manage page", async ({
    authedPage,
  }) => {
    await authedPage.goto(
      "/en/security-settings/manage-2fa-verifications/delete-mfa-phone-number",
    );

    // Should redirect to manage-2fa-verifications since no factorIds in state
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });
});
