import {
  test,
  expect,
  fillGcdsInput,
  fillPhoneInput,
  advancePastIdentityVerification,
  mockPasswordVerifySuccess,
  mockPasswordVerifyFailure,
  mockOtpSendSuccess,
  mockOtpVerifySuccess,
  mockOtpVerifyFailure,
  mockMfaEnrollmentSuccess,
  mockMfaDeleteSuccess,
} from "../fixtures";

const ADD_MFA_URL =
  "/en/security-settings/manage-2fa-verifications/add-mfa-phone-number";
const DELETE_MFA_URL =
  "/en/security-settings/manage-2fa-verifications/delete-mfa-phone-number";
const MANAGE_2FA_URL = "/en/security-settings/manage-2fa-verifications";

// ---------------------------------------------------------------------------
// Add MFA Phone Number — full flows
// ---------------------------------------------------------------------------
test.describe("Add MFA Phone Number", () => {
  test("happy path: verify identity → enter phone → verify MFA OTP → success", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockMfaEnrollmentSuccess(page);

    await authedPage.goto(ADD_MFA_URL);

    // Step 1: Password verification — "First, verify it's you"
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();

    // Step 1→2: Submit password → auto-sends OTP (1 factor)
    await advancePastIdentityVerification(authedPage);

    // Step 3: Enter new phone number — "Enter your new phone number"
    await expect(
      authedPage.getByRole("heading", {
        name: /enter your new phone number/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(authedPage.locator("input[type='tel']").first()).toBeVisible();

    // Fill phone and select SMS method
    await fillPhoneInput(authedPage);
    await authedPage
      .getByText(/text message/i)
      .first()
      .click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 4: Verify MFA OTP — "Check your phone"
    await expect(
      authedPage.getByRole("heading", { name: /check your phone/i }),
    ).toBeVisible({ timeout: 8000 });
    const mfaOtpInput = authedPage.getByLabel(/6-digit code/i);
    await mfaOtpInput.waitFor({ state: "visible", timeout: 5000 });
    await fillGcdsInput(mfaOtpInput, "123456");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 5: Success — optional second MFA or "skip for now" link
    await expect(
      authedPage.getByText(/you have added.*as a 2-step verification/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(authedPage.getByText(/no, skip for now/i)).toBeVisible();
  });

  test("wrong password shows error and blocks progress", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifyFailure(page);

    await authedPage.goto(ADD_MFA_URL);

    // Verify we're on the password step
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Error is shown, still on the same step
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("wrong OTP shows error with retry option", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifyFailure(page, 3);

    await authedPage.goto(ADD_MFA_URL);

    // Password step
    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // OTP step — fill wrong code
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

  test("cancel on password step returns to manage 2FA page", async ({
    authedPage,
  }) => {
    await authedPage.goto(ADD_MFA_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
  });

  test("'No, skip for now' on success step navigates to manage 2FA", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockMfaEnrollmentSuccess(page);

    await authedPage.goto(ADD_MFA_URL);

    // Full flow through to success
    await advancePastIdentityVerification(authedPage);

    await expect(
      authedPage.getByRole("heading", {
        name: /enter your new phone number/i,
      }),
    ).toBeVisible({ timeout: 8000 });

    await fillPhoneInput(authedPage);
    await authedPage
      .getByText(/text message/i)
      .first()
      .click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Verify MFA OTP
    const mfaOtpInput = authedPage.getByLabel(/6-digit code/i);
    await mfaOtpInput.waitFor({ state: "visible", timeout: 5000 });
    await fillGcdsInput(mfaOtpInput, "123456");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Success step — click "No, skip for now"
    await expect(authedPage.getByText(/no, skip for now/i)).toBeVisible({
      timeout: 8000,
    });
    await authedPage.getByText(/no, skip for now/i).click();

    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
      { timeout: 5000 },
    );
  });
});

// ---------------------------------------------------------------------------
// Delete MFA Phone Number — flows
// ---------------------------------------------------------------------------
test.describe("Delete MFA Phone Number", () => {
  test("navigating without state redirects to manage 2FA", async ({
    authedPage,
  }) => {
    await authedPage.goto(DELETE_MFA_URL);
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
    // Should land on manage page with correct heading
    await expect(
      authedPage.getByRole("heading", {
        name: /manage 2-step verification/i,
      }),
    ).toBeVisible();
  });

  test("delete flow from manage page: click Delete → verify → confirm → back", async ({
    authedPage,
    page,
  }) => {
    // Need 2+ phone numbers for Delete link to appear
    await page.route("**/v1/users/otp_factors**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: [
            {
              id: "mfa-factor-1",
              type: "smsotp",
              destination: "+15551234567",
              validated: true,
            },
            {
              id: "mfa-factor-2",
              type: "smsotp",
              destination: "+15559876543",
              validated: true,
            },
          ],
        }),
      });
    });
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockMfaDeleteSuccess(page);

    // Start from the manage 2FA page
    await authedPage.goto(MANAGE_2FA_URL);

    // Click Delete link for the existing phone factor
    const deleteLink = authedPage.getByText(/delete/i).first();
    await expect(deleteLink).toBeVisible({ timeout: 5000 });
    await deleteLink.click();

    // Should navigate to delete flow with password step
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    // Password step
    const passwordInput = authedPage.getByRole("textbox", { name: "Password" });
    await passwordInput.waitFor({ state: "visible", timeout: 5000 });
    await passwordInput.fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // OTP selection step (shown because there are 2+ phone numbers)
    await expect(
      authedPage.getByRole("heading", {
        name: /choose how you want to verify/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    // Click "Text me" for the first phone factor
    const textMeLink = authedPage
      .locator("gcds-link")
      .filter({ hasText: /text me/i })
      .first();
    await textMeLink.waitFor({ state: "visible", timeout: 5000 });
    await textMeLink.click();

    // OTP verification step
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    await otpInput.waitFor({ state: "visible", timeout: 8000 });
    await fillGcdsInput(otpInput, "123456");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm deletion step — "Are you sure you want to delete this phone number?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to delete this phone number/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, delete/i }),
    ).toBeVisible();

    // Confirm deletion
    await authedPage.getByRole("button", { name: /yes, delete/i }).click();

    // Should return to manage 2FA page
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
      { timeout: 5000 },
    );
  });
});
