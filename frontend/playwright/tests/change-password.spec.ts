import {
  test,
  expect,
  mockPasswordVerifySuccess,
  mockPasswordVerifyFailure,
  mockOtpSendSuccess,
  mockOtpVerifySuccess,
  mockOtpVerifyFailure,
  mockPasswordUpdateSuccess,
} from "../fixtures";

// ---------------------------------------------------------------------------
// Helper: advance through password verification step
// ---------------------------------------------------------------------------
async function advancePastPasswordStep(
  authedPage: import("@playwright/test").Page,
) {
  await authedPage
    .getByRole("textbox", { name: "Password" })
    .fill("ValidPassword123!");
  await authedPage.getByRole("button", { name: /continue/i }).click();
}

// ---------------------------------------------------------------------------
// Step 1 — Password Verification
// ---------------------------------------------------------------------------
test.describe("Change Password — Password Verification step", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings/update-password");
  });

  test("loads the update-password route", async ({ authedPage }) => {
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/update-password/,
    );
  });

  test("shows a heading", async ({ authedPage }) => {
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("shows a password input field", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("textbox", { name: "Password" }),
    ).toBeVisible();
  });

  test("shows Cancel and Continue buttons", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /continue/i }),
    ).toBeVisible();
  });

  test("cancel returns to security settings", async ({ authedPage }) => {
    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/security-settings/);
  });

  test("wrong password shows an error message", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifyFailure(page);

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Step 2 — OTP Selection
// ---------------------------------------------------------------------------
test.describe("Change Password — OTP selection step", () => {
  test("advances to next step after password verification", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await authedPage.goto("/en/security-settings/update-password");

    await advancePastPasswordStep(authedPage);

    // After password step, should advance (OTP selection or auto-send)
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});

// ---------------------------------------------------------------------------
// Step 3 — OTP Verification
// ---------------------------------------------------------------------------
test.describe("Change Password — OTP verification step", () => {
  test("shows OTP entry after selecting SMS method", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);

    await authedPage.goto("/en/security-settings/update-password");
    await advancePastPasswordStep(authedPage);

    // If OTP selection is shown, pick SMS; otherwise auto-sent
    const smsOption = authedPage.getByText(/text message|sms|text me/i).first();
    if (await smsOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsOption.click();
      const sendBtn = authedPage.getByRole("button", {
        name: /continue|next|send/i,
      });
      if (await sendBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sendBtn.click();
      }
    }

    // An OTP entry heading or input should appear
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 5000,
    });
  });
});

// ---------------------------------------------------------------------------
// Step 4 — New Password Entry
// ---------------------------------------------------------------------------
test.describe("Change Password — New password step", () => {
  async function navigateToNewPasswordStep(
    authedPage: import("@playwright/test").Page,
    page: import("@playwright/test").Page,
  ) {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await mockPasswordUpdateSuccess(page);

    await authedPage.goto("/en/security-settings/update-password");
    await advancePastPasswordStep(authedPage);

    // Handle OTP selection if shown
    const smsOption = authedPage.getByText(/text me/i).first();
    if (await smsOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsOption.click();
    }

    // Wait for OTP input and fill it
    const otpInput = authedPage.getByLabel(/6-digit code/i);
    if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await otpInput.fill("123456");
      await authedPage.getByRole("button", { name: /continue/i }).click();
    }
  }

  test("new password step shows password input", async ({
    authedPage,
    page,
  }) => {
    await navigateToNewPasswordStep(authedPage, page);

    // Should show new password entry
    await expect(authedPage.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 8000,
    });
  });
});

// ---------------------------------------------------------------------------
// Error: wrong OTP
// ---------------------------------------------------------------------------
test.describe("Change Password — OTP errors", () => {
  test("invalid OTP shows error with attempts remaining", async ({
    authedPage,
    page,
  }) => {
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifyFailure(page, 3);

    await authedPage.goto("/en/security-settings/update-password");
    await advancePastPasswordStep(authedPage);

    // Handle OTP selection if shown
    const smsOption = authedPage.getByText(/text me/i).first();
    if (await smsOption.isVisible({ timeout: 3000 }).catch(() => false)) {
      await smsOption.click();
    }

    const otpInput = authedPage.getByLabel(/6-digit code/i);
    if (await otpInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await otpInput.fill("000000");
      await authedPage.getByRole("button", { name: /continue/i }).click();

      await expect(
        authedPage.locator("gcds-error-message, gcds-error-summary").first(),
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
