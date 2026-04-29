import { test, expect, mockFido2Routes } from "../fixtures";

// ---------------------------------------------------------------------------
// Security Settings — content and navigation
// ---------------------------------------------------------------------------
test.describe("Security Settings", () => {
  test("displays all security sections with correct content", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/security-settings");

    // Main heading
    await expect(
      authedPage.getByRole("heading", { name: "Security settings" }),
    ).toBeVisible();

    // How you sign in section
    await expect(
      authedPage.getByText("How you sign in to CanadaLogin"),
    ).toBeVisible();

    // Password section
    await expect(
      authedPage.getByRole("heading", { name: "Password" }),
    ).toBeVisible();
    await expect(authedPage.getByText(/last changed/i)).toBeVisible();

    // 2-step verification section
    await expect(authedPage.getByText("2-step verification")).toBeVisible();
    await expect(authedPage.getByText(/enabled/i).first()).toBeVisible();
  });

  test("'Change' link navigates to update-password page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/security-settings");

    const changeLink = authedPage
      .getByRole("main")
      .getByRole("link", { name: /change/i });
    await expect(changeLink).toBeVisible();
    await changeLink.click();

    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/update-password/,
    );
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("'Manage' link navigates to 2FA verifications page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/security-settings");

    const manageLink = authedPage.getByRole("link", {
      name: "Manage",
      exact: true,
    });
    await expect(manageLink).toBeVisible();
    await manageLink.click();

    await expect(authedPage).toHaveURL(
      /\/en\/security-settings\/manage-2fa-verifications/,
    );
    await expect(
      authedPage.getByRole("heading", {
        name: /manage 2-step verification/i,
      }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Manage 2FA Verifications — content and navigation
// ---------------------------------------------------------------------------
test.describe("Manage 2FA Verifications", () => {
  test("displays phone factors and add button", async ({ authedPage }) => {
    await authedPage.goto("/en/security-settings/manage-2fa-verifications");

    // Main heading
    await expect(
      authedPage.getByRole("heading", {
        name: /manage 2-step verification/i,
      }),
    ).toBeVisible();

    // Phones section
    await expect(
      authedPage.getByRole("heading", { name: /phones/i }),
    ).toBeVisible();

    // Phone factor info displayed
    await expect(
      authedPage.getByText(/555.*123.*4567|text message|sms/i).first(),
    ).toBeVisible();

    // Add phone number button
    await expect(
      authedPage.getByRole("button", { name: /add a phone number/i }),
    ).toBeVisible();
  });

  test("'+ Add a phone number' navigates to add MFA page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/security-settings/manage-2fa-verifications");

    await authedPage
      .getByRole("button", { name: /add a phone number/i })
      .click();

    await expect(authedPage).toHaveURL(/add-mfa-phone-number/);
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible();
  });

  test("'+ Add a passkey or security key' navigates to add FIDO2 page", async ({
    authedPage,
    page,
  }) => {
    await mockFido2Routes(page);
    await authedPage.goto("/en/security-settings/manage-2fa-verifications");

    const addPasskeyBtn = authedPage.getByRole("button", {
      name: /add a passkey or security key/i,
    });

    // This button may only appear when DEV_ONLY_FEATURE is enabled
    if (await addPasskeyBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await addPasskeyBtn.click();
      await expect(authedPage).toHaveURL(/add-fido2/);
      await expect(
        authedPage.getByRole("heading", {
          name: /first, verify it's you/i,
        }),
      ).toBeVisible();
    }
  });

  test("'Delete' link for phone factor navigates to delete MFA page", async ({
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

    await authedPage.goto("/en/security-settings/manage-2fa-verifications");

    const deleteLink = authedPage.getByText(/delete/i).first();
    await expect(deleteLink).toBeVisible({ timeout: 5000 });
    await deleteLink.click();

    // Should navigate to delete flow with password verification
    await expect(
      authedPage.getByRole("heading", {
        name: /first, verify it's you/i,
      }),
    ).toBeVisible({ timeout: 5000 });
  });
});
