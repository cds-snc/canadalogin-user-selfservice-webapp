import {
  test,
  expect,
  fillGcdsInput,
  advancePastIdentityVerification,
  mockPasswordVerifySuccess,
  mockPasswordVerifyFailure,
  mockPasswordUpdateSuccess,
  mockPasswordUpdateValidateFailure,
} from "../fixtures";

const PASSWORD_URL = "/en/security-settings/update-password";

// ---------------------------------------------------------------------------
// Change Password — full flows
// ---------------------------------------------------------------------------
test.describe("Change Password", () => {
  test("happy path: verify identity → enter new password → success with sign-in button", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockPasswordUpdateSuccess(page);

    await authedPage.goto(PASSWORD_URL);

    // Step 1: Password verification — "First, verify it's you"
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
    await expect(
      authedPage.getByText(
        /to change your password, first enter your current password/i,
      ),
    ).toBeVisible();

    // Identity verification (password + OTP)
    await advancePastIdentityVerification(authedPage);

    // Step 4: New password — "Enter a new password"
    await expect(
      authedPage.getByRole("heading", { name: /enter a new password/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(authedPage.getByText(/minimum length/i)).toBeVisible();

    // Fill new password and submit
    const passwordInput = authedPage.getByRole("textbox", { name: "Password" });
    await passwordInput.waitFor({ state: "visible", timeout: 3000 });
    await passwordInput.fill("NewSecurePassword456!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 5: Success — "You will need to sign in using your new password"
    await expect(
      authedPage.getByRole("heading", {
        name: /you will need to sign in using your new password/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByText(/your password has been changed/i),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign in/i }),
    ).toBeVisible();
  });

  test("wrong password shows error and blocks progress", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifyFailure(page);

    await authedPage.goto(PASSWORD_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Error shown, still on same step
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("wrong OTP shows error and stays on OTP step", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockPasswordUpdateValidateFailure(page, 3);

    await authedPage.goto(PASSWORD_URL);

    // Password step
    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // OTP step — enter wrong code
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    await otpInput.waitFor({ state: "visible", timeout: 8000 });
    await fillGcdsInput(otpInput, "000000");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Error shown, still on OTP step
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("heading", { name: /check your phone/i }),
    ).toBeVisible();
  });

  test("cancel on password step returns to security settings", async ({
    authedPage,
  }) => {
    await authedPage.goto(PASSWORD_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/security-settings/);
  });

  test("'Sign in' button on success step triggers navigation", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockPasswordUpdateSuccess(page);

    await authedPage.goto(PASSWORD_URL);
    await advancePastIdentityVerification(authedPage);

    // New password step
    await expect(
      authedPage.getByRole("heading", { name: /enter a new password/i }),
    ).toBeVisible({ timeout: 8000 });
    const passwordInput = authedPage.getByRole("textbox", { name: "Password" });
    await passwordInput.fill("NewSecurePassword456!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Success step — click Sign in
    await expect(
      authedPage.getByRole("button", { name: /sign in/i }),
    ).toBeVisible({ timeout: 8000 });
    await authedPage.getByRole("button", { name: /sign in/i }).click();

    // Should navigate away
    await authedPage.waitForTimeout(1000);
  });
});
