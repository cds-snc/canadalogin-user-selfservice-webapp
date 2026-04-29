import {
  test,
  expect,
  fillGcdsInput,
  advancePastIdentityVerification,
  mockPasswordVerifySuccess,
  mockPasswordVerifyFailure,
  mockOtpSendSuccess,
  mockOtpVerifySuccess,
  mockOtpVerifyFailure,
  mockProfileUpdateWithOtpSuccess,
} from "../fixtures";

const EMAIL_URL = "/en/profile/update-email";

// ---------------------------------------------------------------------------
// Edit Email — full flows
// ---------------------------------------------------------------------------
test.describe("Edit Email Address", () => {
  test("happy path: verify identity → enter email → email OTP → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockProfileUpdateWithOtpSuccess(page);

    await authedPage.goto(EMAIL_URL);

    // Step 1: Password verification — "First, verify it's you"
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    // Identity verification (password + phone OTP)
    await advancePastIdentityVerification(authedPage);

    // Step 4: Enter email — "Enter a new email address"
    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new email address/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByText(/changing your email address will affect/i),
    ).toBeVisible();

    // Fill email and continue
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 5: Email OTP — "Check your email"
    await expect(
      authedPage.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByText(/we have sent an email with a 6-digit code/i),
    ).toBeVisible();

    // Fill email OTP
    const emailOtpInput = authedPage.getByLabel(/6-digit code/i);
    await emailOtpInput.waitFor({ state: "visible", timeout: 5000 });
    await fillGcdsInput(emailOtpInput, "654321");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 6: Confirm — "Are you sure you want to update your email?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your email/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible();
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Step 7: Success — "You may need to update your email other places"
    await expect(
      authedPage.getByText(/your email has been updated/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });

  test("wrong password shows error and blocks progress", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifyFailure(page);

    await authedPage.goto(EMAIL_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Error shown, still on password step
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("wrong email OTP shows error on confirmation step", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    // Mock the profile update-with-otp endpoint to fail (wrong OTP)
    await page.route("**/v1/users/profile/update-with-otp**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid code. You have 3 attempts remaining.",
          messageId: "INVALID_OTP",
        }),
      });
    });

    await authedPage.goto(EMAIL_URL);
    await advancePastIdentityVerification(authedPage);

    // Enter email step
    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new email address/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Email OTP step — enter code
    await expect(
      authedPage.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible({ timeout: 8000 });
    const emailOtpInput = authedPage.getByLabel(/6-digit code/i);
    await fillGcdsInput(emailOtpInput, "000000");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step — click "Yes, update" — should show error
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your email/i,
      }),
    ).toBeVisible({ timeout: 5000 });
    await authedPage.getByRole("button", { name: /yes, update/i }).click();
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("cancel on password step returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto(EMAIL_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("'Use a different email' link is visible on email OTP step", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);

    await authedPage.goto(EMAIL_URL);
    await advancePastIdentityVerification(authedPage);

    // Enter email
    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new email address/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Email OTP step should have "Use a different email" link
    await expect(
      authedPage.getByRole("heading", { name: /check your email/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(authedPage.getByText(/use a different email/i)).toBeVisible();
  });

  test("'Back to profile' button on success navigates to profile", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockProfileUpdateWithOtpSuccess(page);

    await authedPage.goto(EMAIL_URL);
    await advancePastIdentityVerification(authedPage);

    // Enter email
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await emailInput.waitFor({ state: "visible", timeout: 8000 });
    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Email OTP
    const emailOtpInput = authedPage.getByLabel(/6-digit code/i);
    await emailOtpInput.waitFor({ state: "visible", timeout: 8000 });
    await fillGcdsInput(emailOtpInput, "654321");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm
    await authedPage
      .getByRole("button", { name: /yes, update/i })
      .waitFor({ state: "visible", timeout: 5000 });
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Success — click "Back to profile"
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible({ timeout: 8000 });
    await authedPage.getByRole("button", { name: /back to profile/i }).click();

    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });
});
