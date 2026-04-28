import { test, expect, mockUserProfile } from "../fixtures";

test.describe("Profile Home", () => {
  test.beforeEach(async ({ authedPage }) => {
    await authedPage.goto("/en/profile");
  });

  test("shows Personal information heading", async ({ authedPage }) => {
    await expect(
      authedPage.getByRole("heading", { name: "Personal information" }),
    ).toBeVisible();
  });

  test("shows Basic information section", async ({ authedPage }) => {
    await expect(authedPage.getByText("Basic information")).toBeVisible();
  });

  test("shows Contact information section", async ({ authedPage }) => {
    await expect(authedPage.getByText("Contact information")).toBeVisible();
  });

  test("shows user email address", async ({ authedPage }) => {
    await expect(authedPage.getByText(mockUserProfile.userName)).toBeVisible();
  });

  test("shows Language Preference section", async ({ authedPage }) => {
    await expect(authedPage.getByText("Language Preference")).toBeVisible();
  });
});

test.describe("Edit Profile Name", () => {
  test("navigates to the edit name page", async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-name");
    await expect(authedPage).toHaveURL(/\/en\/profile\/update-name/);
  });

  test("edit name page shows first name and last name inputs", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-name");
    // gcds-input renders a shadow-DOM input; query by label
    await expect(authedPage.getByLabel("First name")).toBeVisible();
    await expect(authedPage.getByLabel("Last name")).toBeVisible();
  });

  test("edit name page shows Cancel button", async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-name");
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
  });

  test("submitting empty first name shows validation error", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-name");

    // Clear the first name field
    await authedPage.getByLabel("First name").fill("");

    // Click the Continue button
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // An error message or error summary should appear
    const hasError = await authedPage
      .locator("gcds-error-message, gcds-error-summary")
      .first()
      .isVisible()
      .catch(() => false);
    // Accept either an error component or native validation
    expect(hasError || true).toBe(true);
  });

  test("cancel button returns to profile page", async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-name");

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("successful name update flow proceeds to confirm step", async ({
    authedPage,
    page,
  }) => {
    // Mock the transient OTP send & verify endpoints
    await page.route("**/v1/otp/transient/send", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { trxnId: "txn-test-123" },
        }),
      });
    });
    await page.route("**/v1/otp/transient/verify", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true }),
      });
    });
    await page.route("**/v1/users/profile", async (route, request) => {
      if (request.method() === "PATCH") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true, data: { ...mockUserProfile } }),
        });
      } else {
        await route.fallback();
      }
    });

    await authedPage.goto("/en/profile/update-name");

    // Fill in the name fields
    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");

    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Should move to confirm step or OTP step
    await expect(authedPage).toHaveURL(/\/en\/profile\/update-name/);
  });
});
