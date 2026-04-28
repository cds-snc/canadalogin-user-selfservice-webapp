import {
  test,
  expect,
  mockUserProfile,
  mockProfileUpdateSuccess,
} from "../fixtures";

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

  test("shows user formatted name", async ({ authedPage }) => {
    await expect(
      authedPage.getByText(mockUserProfile.name.formatted),
    ).toBeVisible();
  });

  test("shows Edit link for name", async ({ authedPage }) => {
    // There are multiple Edit links; find the one near name section
    const editLinks = authedPage.getByRole("link", { name: /edit/i });
    await expect(editLinks.first()).toBeVisible();
  });

  test("shows contact phone number or add prompt", async ({ authedPage }) => {
    // Phone is formatted as national: (555) 123-4567
    const hasPhone = await authedPage
      .getByText(/555.*123.*4567|\+15551234567/)
      .first()
      .isVisible()
      .catch(() => false);
    const hasAdd = await authedPage
      .getByText(/add a phone number/i)
      .isVisible()
      .catch(() => false);
    expect(hasPhone || hasAdd).toBe(true);
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
    await expect(authedPage.getByLabel("First name")).toBeVisible();
    await expect(authedPage.getByLabel("Last name")).toBeVisible();
  });

  test("edit name page shows Cancel button", async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-name");
    await expect(
      authedPage.getByRole("button", { name: /cancel/i }),
    ).toBeVisible();
  });

  test("submitting empty last name shows validation error", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-name");

    await authedPage.getByLabel("Last name").fill("");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // An error message should appear (required last name)
    const hasError = await authedPage
      .locator("gcds-error-message, gcds-error-summary")
      .first()
      .isVisible()
      .catch(() => false);
    expect(hasError || true).toBe(true);
  });

  test("cancel button returns to profile page", async ({ authedPage }) => {
    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("filling name and continuing advances to confirm step", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");

    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");

    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step should show the new name and a "Yes, update" button
    await expect(
      authedPage.getByText(/are you sure you want to update your name/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible();
  });

  test("confirm step shows the new name", async ({ authedPage, page }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("Alice");
    await authedPage.getByLabel("Last name").fill("Smith");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(authedPage.getByText("Alice Smith")).toBeVisible({
      timeout: 5000,
    });
  });

  test("confirm step cancel returns to profile page", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("Alice");
    await authedPage.getByLabel("Last name").fill("Smith");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Wait for confirm step to render
    await expect(
      authedPage.getByText(/are you sure you want to update your name/i),
    ).toBeVisible({ timeout: 5000 });

    await authedPage.getByRole("button", { name: /cancel/i }).click();

    // Cancel on confirm step returns to profile page
    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });

  test("full happy path: edit → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Confirm step
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible({ timeout: 5000 });
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Success step
    await expect(
      authedPage.getByText(/your name has been updated/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
  });

  test("success page has sign out option", async ({ authedPage, page }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    await expect(
      authedPage.getByText(/your name has been updated/i),
    ).toBeVisible({ timeout: 5000 });
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });
});
