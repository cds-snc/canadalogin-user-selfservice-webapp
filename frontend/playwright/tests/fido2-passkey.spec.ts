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
  mockFido2Routes,
} from "../fixtures";

const ADD_FIDO2_URL =
  "/en/security-settings/manage-2fa-verifications/add-fido2";
const DELETE_FIDO2_URL =
  "/en/security-settings/manage-2fa-verifications/delete-fido2";
const MANAGE_2FA_URL = "/en/security-settings/manage-2fa-verifications";

// ---------------------------------------------------------------------------
// Helper: set up a virtual authenticator via CDP
// ---------------------------------------------------------------------------
async function setupVirtualAuthenticator(
  page: import("@playwright/test").Page,
) {
  const cdpSession = await page.context().newCDPSession(page);
  await cdpSession.send("WebAuthn.enable");
  const { authenticatorId } = await cdpSession.send(
    "WebAuthn.addVirtualAuthenticator",
    {
      options: {
        protocol: "ctap2",
        transport: "internal",
        hasResidentKey: true,
        hasUserVerification: true,
        isUserVerified: true,
      },
    },
  );
  return { cdpSession, authenticatorId };
}

// Helper: override fido2/user to return no existing passkeys
// (needed so identity verification auto-sends OTP instead of showing selection)
async function mockNoExistingPasskeys(page: import("@playwright/test").Page) {
  await page.route("**/v1/fido2/user**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true, data: { fido2: [] } }),
    });
  });
}

// ---------------------------------------------------------------------------
// Add FIDO2 Passkey — full flows
// ---------------------------------------------------------------------------
test.describe("Add FIDO2 Passkey", () => {
  test("happy path: verify identity → create passkey → name passkey", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await mockNoExistingPasskeys(page);
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);

    // Set up virtual authenticator so WebAuthn calls succeed
    await setupVirtualAuthenticator(page);

    await authedPage.goto(ADD_FIDO2_URL);

    // Step 1: Password verification — "First, verify it's you"
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    // Steps 1→2→3: Identity verification (password + OTP)
    await advancePastIdentityVerification(authedPage);

    // Step 4: "How to create a passkey" with "Create a passkey" button
    await expect(
      authedPage.getByRole("heading", {
        name: /how to create a passkey/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /create a passkey/i }),
    ).toBeVisible();

    // Click "Create a passkey" — virtual authenticator handles WebAuthn prompt
    await authedPage.getByRole("button", { name: /create a passkey/i }).click();

    // Step 5: "Name your passkey"
    await expect(
      authedPage.getByRole("heading", { name: /name your passkey/i }),
    ).toBeVisible({ timeout: 10000 });
    await expect(authedPage.getByLabel(/passkey name/i)).toBeVisible();

    // Fill passkey nickname and submit
    const nicknameInput = authedPage.getByLabel(/passkey name/i);
    await fillGcdsInput(nicknameInput, "My Test Passkey");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Should navigate back to manage 2FA page
    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
      { timeout: 8000 },
    );
  });

  test("wrong password shows error and blocks progress", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await mockPasswordVerifyFailure(page);

    await authedPage.goto(ADD_FIDO2_URL);

    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();

    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("wrongpassword");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Error visible, still on same step
    await expect(
      authedPage.locator("gcds-error-message, gcds-error-summary").first(),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("wrong OTP shows error on verification step", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await mockNoExistingPasskeys(page);
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifyFailure(page, 3);

    await authedPage.goto(ADD_FIDO2_URL);

    // Password step
    await authedPage
      .getByRole("textbox", { name: "Password" })
      .fill("ValidPassword123!");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // OTP step — wrong code
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
    page,
  }) => {
    await mockFido2Routes(page);
    await authedPage.goto(ADD_FIDO2_URL);

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

  test("'Help with creating a passkey' link is visible on create step", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await mockNoExistingPasskeys(page);
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);

    await authedPage.goto(ADD_FIDO2_URL);
    await advancePastIdentityVerification(authedPage);

    await expect(
      authedPage.getByRole("heading", {
        name: /how to create a passkey/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("link", { name: /help with creating a passkey/i }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Delete FIDO2 Passkey — flows
// ---------------------------------------------------------------------------
test.describe("Delete FIDO2 Passkey", () => {
  test("navigating to delete page directly shows password verification", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await authedPage.goto(DELETE_FIDO2_URL);
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("delete flow from manage page: click Delete → verify → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await mockPasswordVerifySuccess(page);
    await mockOtpSendSuccess(page);
    await mockOtpVerifySuccess(page);
    await setupVirtualAuthenticator(page);

    // Start from manage 2FA page
    await authedPage.goto(MANAGE_2FA_URL);

    // Click Delete button for the existing passkey
    const deleteBtn = authedPage
      .getByRole("button", { name: /delete/i })
      .first();
    await expect(deleteBtn).toBeVisible({ timeout: 5000 });
    await deleteBtn.click();

    // Override fido2/user to return empty so the delete page auto-sends OTP
    await mockNoExistingPasskeys(page);

    // Should navigate to delete flow — password step
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    // Identity verification
    await advancePastIdentityVerification(authedPage);

    // Confirm deletion — "Are you sure you want to delete this passkey?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to delete this passkey/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, delete/i }),
    ).toBeVisible();

    // Confirm
    await authedPage.getByRole("button", { name: /yes, delete/i }).click();

    // Success step — "Remove passkey from your device (optional)"
    await expect(
      authedPage.getByRole("heading", {
        name: /remove passkey from your device/i,
      }),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /continue/i }),
    ).toBeVisible();

    // Click continue to return to manage page
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
      { timeout: 5000 },
    );
  });
});
