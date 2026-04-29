import {
  test,
  expect,
  mockUserProfile,
  mockProfileUpdateSuccess,
} from "../fixtures";

// ---------------------------------------------------------------------------
// Profile Home — content and navigation
// ---------------------------------------------------------------------------
test.describe("Profile Home", () => {
  test("displays all profile sections with user data", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile");

    // Main heading
    await expect(
      authedPage.getByRole("heading", { name: "Personal information" }),
    ).toBeVisible();

    // Basic information section
    await expect(
      authedPage.getByRole("heading", { name: /basic information/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByText(mockUserProfile.name.formatted),
    ).toBeVisible();

    // Contact information section
    await expect(
      authedPage.getByRole("heading", { name: /contact information/i }),
    ).toBeVisible();
    await expect(authedPage.getByText(mockUserProfile.userName)).toBeVisible();

    // Communication section
    await expect(
      authedPage.getByRole("heading", { name: /communication/i }),
    ).toBeVisible();
    await expect(authedPage.getByText(/language preference/i)).toBeVisible();
  });

  test("Edit name link navigates to update-name page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile");

    // Click the first Edit link (name)
    const editLinks = authedPage.getByRole("link", { name: /edit/i });
    await editLinks.first().click();

    await expect(authedPage).toHaveURL(/\/en\/profile\/update-name/);
    await expect(
      authedPage.getByRole("heading", { name: /edit your name/i }),
    ).toBeVisible();
  });

  test("Edit language preference link navigates correctly", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile");

    // Find the Edit link near language preference section
    const langEditLink = authedPage.getByRole("link", { name: /edit/i }).last();
    await langEditLink.click();

    await expect(authedPage).toHaveURL(/\/en\/profile\/update-language/);
    await expect(
      authedPage.getByRole("heading", {
        name: /edit your language preference/i,
      }),
    ).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Edit Profile Name — full flow
// ---------------------------------------------------------------------------
test.describe("Edit Profile Name", () => {
  test("happy path: edit name → confirm → success", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");

    // Step 1: Edit name — "Edit your name"
    await expect(
      authedPage.getByRole("heading", { name: /edit your name/i }),
    ).toBeVisible();
    await expect(authedPage.getByLabel("First name")).toBeVisible();
    await expect(authedPage.getByLabel("Last name")).toBeVisible();

    // Fill name fields
    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    // Step 2: Confirm — "Are you sure you want to update your name?"
    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your name/i,
      }),
    ).toBeVisible({ timeout: 5000 });
    await expect(authedPage.getByText("NewFirst NewLast")).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /yes, update/i }),
    ).toBeVisible();

    // Confirm update
    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    // Step 3: Success — "You may need to update your name in other places."
    await expect(
      authedPage.getByText(/your name has been updated/i),
    ).toBeVisible({ timeout: 8000 });
    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible();
    await expect(
      authedPage.getByRole("button", { name: /sign out/i }),
    ).toBeVisible();
  });

  test("cancel on edit step returns to profile page", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en/profile/update-name");

    await expect(
      authedPage.getByRole("heading", { name: /edit your name/i }),
    ).toBeVisible();

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/);
  });

  test("cancel on confirm step returns to profile page", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("Alice");
    await authedPage.getByLabel("Last name").fill("Smith");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await expect(
      authedPage.getByRole("heading", {
        name: /are you sure you want to update your name/i,
      }),
    ).toBeVisible({ timeout: 5000 });

    await authedPage.getByRole("button", { name: /cancel/i }).click();
    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });

  test("'Back to profile' button on success navigates to profile", async ({
    authedPage,
    page,
  }) => {
    await mockProfileUpdateSuccess(page);

    await authedPage.goto("/en/profile/update-name");
    await authedPage.getByLabel("First name").fill("NewFirst");
    await authedPage.getByLabel("Last name").fill("NewLast");
    await authedPage.getByRole("button", { name: /continue/i }).click();

    await authedPage.getByRole("button", { name: /yes, update/i }).click();

    await expect(
      authedPage.getByRole("button", { name: /back to profile/i }),
    ).toBeVisible({ timeout: 8000 });
    await authedPage.getByRole("button", { name: /back to profile/i }).click();

    await expect(authedPage).toHaveURL(/\/en\/profile/, { timeout: 5000 });
  });
});
