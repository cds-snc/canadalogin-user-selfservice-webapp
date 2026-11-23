import { expect, test as setup, type Page } from "@playwright/test";
import { IbmVerifyLoginPage } from "../pages/IbmVerifyLoginPage";
import { ManageDashboardPage } from "../pages/ManageDashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { env } from "../support/env";
import { getIdvClaims } from "../support/idvApi";
import { TEST_USERS, type TestUser } from "../support/testUsers";

// Sign each test user in, check the Identity details card on /en/profile, and save
// the session for the test projects to reuse.

setup("sign in as proven-user, validate verified claims", async ({ page }) => {
  const user = TEST_USERS.proven;
  const card = await signInAndOpenProfile(page, user);

  await setup.step("Identity details card shows the proven information", async () => {
    // Stop here if the card isn't rendered at all.
    await expect(card.heading, "Identity details heading is shown").toBeVisible();

    // Soft assertions: report every field that doesn't match, not just the first.
    // Fake ID proofing data for this account; update the date if it proofs again.
    await expect.soft(card.verifiedBadge, "Verified badge").toHaveText("Verified on November 19, 2026");
    await expect.soft(card.legalName, "Legal name").toHaveText("FAKEFIRST FAKELAST");
    await expect.soft(card.dateOfBirth, "Date of birth").toHaveText("December 2, 1995");
    await expect.soft(card.sourceOfInformation, "Source of information").toHaveText("Driver's Licence (Quebec)");
    await expect.soft(card.updateInformationText, "Re-proofing notice").toBeVisible();
    await expect.soft(card.updateInformationLink, "Update information link").toBeVisible();
  });

  await page.context().storageState({ path: user.storageState });
});

setup("sign in as unproven-user, verified claims missing", async ({ page }) => {
  const user = TEST_USERS.unproven;
  const card = await signInAndOpenProfile(page, user);

  await setup.step("Identity details card is not shown", async () => {
    await expect(card.heading, "Identity details heading").toHaveCount(0);
    await expect(card.verifiedBadge, "Verified badge").toHaveCount(0);
    await expect(card.legalName, "Legal name").toHaveCount(0);
    await expect(card.dateOfBirth, "Date of birth").toHaveCount(0);
    await expect(card.sourceOfInformation, "Source of information").toHaveCount(0);
    await expect(card.updateInformationLink, "Update information link").toHaveCount(0);
  });

  await page.context().storageState({ path: user.storageState });
});

/** Signs in through IBM Verify, then clicks dashboard -> "Personal information" -> /en/profile. */
async function signInAndOpenProfile(page: Page, user: TestUser) {
  await setup.step("Sign in through IBM Verify", async () => {
    // The frontend's PrivateRoute redirects to /v1/auth/login, which redirects to IBM Verify.
    await page.goto("/en");
    await new IbmVerifyLoginPage(page).login(user.email(), user.password());
    // IBM Verify -> backend /v1/auth/callback -> frontend dashboard (/en)
    await page.waitForURL((url) => url.href.startsWith(env.baseURL), {
      timeout: 30_000,
    });
    // Fail early with a clear error if the backend session isn't usable.
    await getIdvClaims(page.request);
  });

  const dashboard = new ManageDashboardPage(page);
  const profile = new ProfilePage(page);

  await setup.step('Open "Personal information" from the dashboard', async () => {
    await dashboard.expectLoaded();
    await dashboard.openPersonalInformation();
    await expect(page, "Navigated to the profile page").toHaveURL(/\/en\/profile$/);
    await profile.expectLoaded();
  });

  return profile.provenInformation;
}
