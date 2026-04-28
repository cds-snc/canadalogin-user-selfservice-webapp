import { test, expect, mockMfaFactors } from "../fixtures";

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
    await expect(
      authedPage.getByRole("heading", { name: "Password" }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("main").getByRole("link", { name: /change/i }),
    ).toBeVisible();
  });

  test("shows 2-step verification section", async ({ authedPage }) => {
    await expect(authedPage.getByText("2-step verification")).toBeVisible();
  });

  test("shows Manage link for 2-step verification", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("link", { name: "Manage", exact: true }),
    ).toBeVisible();
  });

  test("shows password last changed date", async ({ authedPage }) => {
    // The mock profile has pwdChangedTime; should show "Last changed on ..."
    await expect(authedPage.getByText(/last changed/i)).toBeVisible();
  });

  test("shows 2FA enabled status", async ({ authedPage }) => {
    // Mock user has twoFactorAuthentication: true → should show "Enabled"
    await expect(authedPage.getByText(/enabled/i).first()).toBeVisible();
  });

  test("Change password link navigates to password page", async ({
    authedPage,
  }) => {
    const changeLink = authedPage
      .getByRole("main")
      .getByRole("link", { name: /change/i });
    await changeLink.click();
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/update-password/,
    );
  });

  test("Manage link navigates to 2FA verifications page", async ({
    authedPage,
  }) => {
    const manageLink = authedPage.getByRole("link", {
      name: "Manage",
      exact: true,
    });
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

  test("shows Phones section heading", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("heading", { name: /phones/i }),
    ).toBeVisible();
  });

  test("shows existing phone factor info", async ({ authedPage }) => {
    // The mock has +15551234567 as an SMS OTP factor
    // Phone may be displayed in national format or as raw number
    const phoneOrType = await authedPage
      .getByText(/555.*123.*4567|text message|sms/i)
      .first()
      .isVisible()
      .catch(() => false);
    // At minimum the Phones section with the number is rendered
    expect(phoneOrType).toBe(true);
  });

  test("shows Add phone number button", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("button", { name: /add a phone number/i }),
    ).toBeVisible();
  });

  test("Add phone number navigates to add MFA page", async ({ authedPage }) => {
    await authedPage
      .getByRole("button", { name: /add a phone number/i })
      .click();
    await expect(authedPage).toHaveURL(/add-mfa-phone-number/);
  });
});
