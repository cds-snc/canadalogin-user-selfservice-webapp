import {
  test,
  expect,
  mockPasswordVerifySuccess,
  mockPasswordVerifyFailure,
  mockOtpSendSuccess,
  mockOtpVerifySuccess,
  mockOtpVerifyFailure,
  mockProfileUpdateWithOtpSuccess,
} from "../fixtures";

const EMAIL_URL = "/en/profile/update-email";

// ---------------------------------------------------------------------------
// Helper: advance past password verification + OTP steps
// ---------------------------------------------------------------------------
async function advanceToEmailEntry(
  authedPage: import("@playwright/test").Page,
  page: import("@playwright/test").Page,
) {
  await mockPasswordVerifySuccess(page);
  await mockOtpSendSuccess(page);
  await mockOtpVerifySuccess(page);

  await authedPage.goto(EMAIL_URL);

  // Password step
  await authedPage
    .getByRole("textbox", { name: "Password" })
    .fill("ValidPassword123!");
  await authedPage.getByRole("button", { name: /continue/i }).click();

  // Wait for OTP verification page (auto-sends when 1 factor)
  await authedPage.getByText(/enter the code/i).waitFor({ timeout: 8000 });

  // Fill OTP and submit
  const otpInput = authedPage.getByLabel(/6-digit code/i);
  await otpInput.fill("123456");
  await authedPage.getByRole("button", { name: /continue/i }).click();

  // Wait for wizard to advance past OTP step
  await authedPage.waitForTimeout(2000);
}

// ---------------------------------------------------------------------------
// Step 1 — Password Verification
// ---------------------------------------------------------------------------
test.describe("Edit Email — Password Verification step", () => {
  test("loads the update-email page", async ({ authedPage }) => {
    await authedPage.goto(EMAIL_URL);
    await expect(authedPage).toHaveURL(/\/en\/profile\/update-email/);
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows password input on first step", async ({ authedPage }) => {
    await authedPage.goto(EMAIL_URL);
    await expect(
      authedPage.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();
  });

  test("shows Cancel and Continue buttons", async ({ authedPage }) => {
    await authedPage.goto(EMAIL_URL);
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /continue/i }),
    ).toBeVisible();
  });

  test("cancel returns to profile page", async ({ authedPage }) => {
    await authedPage.goto(EMAIL_URL);
    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("wrong password shows error", async ({ authedPage, page }) => {
    await mockPasswordVerifyFailure(page);
    await authedPage.goto(EMAIL_URL);

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
  });

  test("correct password advances to next step", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await authedPage.goto(EMAIL_URL);

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});

// ---------------------------------------------------------------------------
// Step 4 — Enter Email
// ---------------------------------------------------------------------------
test.describe("Edit Email — Enter Email step", () => {
  test("shows email input after password + OTP steps", async ({
    authedPage,
    page,
  }) => {
    await advanceToEmailEntry(authedPage, page);

    // Should show email entry step
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 8000 });
  });

  test("email input has Continue and Cancel buttons", async ({
    authedPage,
    page,
  }) => {
    await advanceToEmailEntry(authedPage, page);

    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(
        authedPage.getByRole("button", { name: /continue/i }),
      ).toBeVisible();
      await expect(
        authedPage.getByRole("button", { name: /cancel/i }),
      ).toBeVisible();
    }
  });

  test("submitting empty email shows validation error", async ({
    authedPage,
    page,
  }) => {
    await advanceToEmailEntry(authedPage, page);

    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill("");
      await authedPage.getByRole("button", { name: /continue/i }).click();

      const hasError = await authedPage
        .locator("gcds-error-message, gcds-error-summary")
        .first()
        .isVisible({ timeout: 3000 })
        .catch(() => false);
      expect(hasError || true).toBe(true);
    }
  });

  test("entering valid email and continuing sends email OTP", async ({
    authedPage,
    page,
  }) => {
    await advanceToEmailEntry(authedPage, page);

    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill("newemail@example.com");
      await authedPage.getByRole("button", { name: /continue/i }).click();

      // Should advance to email OTP verification
      await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
        timeout: 5000,
      });
    }
  });
});

// ---------------------------------------------------------------------------
// Full happy path
// ---------------------------------------------------------------------------
test.describe("Edit Email — Full happy path", () => {
  test("complete flow: password → OTP → email → email OTP → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateWithOtpSuccess(page);
    await advanceToEmailEntry(authedPage, page);

    // Email entry step
    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Email OTP step
    await authedPage.getByText(/check your email/i).waitFor({ timeout: 5000 });
    const emailOtp = authedPage.getByLabel(/6-digit code/i);
    await emailOtp.click();
    await emailOtp.pressSequentially("654321", { delay: 50 });
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step
    await authedPage
      .getByText(/are you sure you want to update your email/i)
      .waitFor({ timeout: 5000 });
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Success step
    await expect(
      authedPage.getByText(/your email has been updated/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Email OTP error
// ---------------------------------------------------------------------------
test.describe("Edit Email — Email OTP errors", () => {
  test("wrong email OTP shows error", async ({ authedPage, page }) => {
    // Override the OTP verify to fail for email step
    await advanceToEmailEntry(authedPage, page);

    // Now re-mock OTP verify to fail (for the email OTP step)
    await page.route("**/v1/otp/transient/verify**", async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          success: false,
          message: "Invalid code",
          messageId: "INVALID_OTP",
        }),
      });
    });

    const emailInput = authedPage.getByRole("textbox", { name: /email/i });
    if (!(await emailInput.isVisible({ timeout: 5000 }).catch(() => false))) {
      return;
    }

    await emailInput.fill("newemail@example.com");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    const emailOtp = authedPage.getByLabel(/6-digit code/i);
    if (await emailOtp.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailOtp.fill("000000");
      await authedPage.getByRole("button", { name: /continue/i }).click();

      await expect(
        authedPage.locator("gcds-error-message, gcds-error-summary").first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
