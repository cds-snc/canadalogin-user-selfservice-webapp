import {
  test,
  expect,
  fillGcdsInput,
  fillPhoneInput,
  mockOtpSendSuccess,
  mockOtpVerifySuccess,
  mockOtpVerifyFailure,
  mockProfileUpdateWithOtpSuccess,
} from "../fixtures";

const PHONE_URL = "/en/profile/update-contact-phone";

// ---------------------------------------------------------------------------
// Edit Contact Phone Number — full flows
// ---------------------------------------------------------------------------
test.describe("Edit Contact Phone Number", () => {
  test("happy path: enter phone → verify OTP → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockProfileUpdateWithOtpSuccess(page);

    await authedPage.goto(PHONE_URL);

    // Step 1: Enter phone — "Enter a new phone number"
    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new phone number/i,
      }),
    ).toBeVisible();
    await expect(authedPage.locator("input[type='tel']").first()).toBeVisible();

    // Fill phone number and select SMS
    await fillPhoneInput(authedPage);
    await authedPage
      .getByText(/text message/i)
      .first()
      .click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 2: OTP verification — "Check your phone"
    await expect(
      authedPage.getByRole("heading", { name: /check your phone/i }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByText(/we have sent a text message/i),
    ).toBeVisible();

    // Fill OTP
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    await otpInput.waitFor({ state: "visible", timeout: 5000 });
    await fillGcdsInput(otpInput, "123456");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 3: Confirm — "Are you sure you want to update your phone number?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your phone number/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible();
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Step 4: Success — "You may need to update your phone number in other places"
    await expect(
      authedPage.getByText(/your contact phone number has been updated/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });

  test("wrong OTP shows error on confirmation step", async ({
    authedPage,
    page,
  }) => {
    await mockOtpSendSuccess(page);
    // Mock the profile/update-with-otp endpoint to fail (wrong OTP)
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

    await authedPage.goto(PHONE_URL);

    // Enter phone
    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new phone number/i,
      }),
    ).toBeVisible();
    await fillPhoneInput(authedPage);
    await authedPage
      .getByText(/text message/i)
      .first()
      .click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // OTP step — enter code
    await expect(
      authedPage.getByRole("heading", { name: /check your phone/i }),
    ).toBeVisible({ timeout: 8000 });
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    await otpInput.waitFor({ state: "visible", timeout: 5000 });
    await fillGcdsInput(otpInput, "000000");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step — "Are you sure you want to update?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    // Click "Yes, update" — should show error
    await authedPage.getByRole("button", { name: /yes, update/i }).click();
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("cancel on phone entry returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto(PHONE_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new phone number/i,
      }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("'Back to profile' button on success navigates to profile", async ({
    authedPage,
    page,
  }) => {
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockProfileUpdateWithOtpSuccess(page);

    await authedPage.goto(PHONE_URL);

    // Enter phone
    await fillPhoneInput(authedPage);
    await authedPage
      .getByText(/text message/i)
      .first()
      .click();
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Verify OTP
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    await otpInput.waitFor({ state: "visible", timeout: 8000 });
    await fillGcdsInput(otpInput, "123456");
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

  test("OTP radio options (SMS / Voice) are visible on phone entry", async ({
    authedPage,
  }) => {
    await authedPage.goto(PHONE_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /enter a new phone number/i,
      }),
    ).toBeVisible();
    await expect(authedPage.getByText(/text message/i).first()).toBeVisible();
    await expect(authedPage.getByText(/voice call/i).first()).toBeVisible();
  });
});
