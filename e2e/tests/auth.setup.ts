import { test as setup } from "@playwright/test";
import { IbmVerifyLoginPage } from "../pages/IbmVerifyLoginPage";
import { ManageDashboardPage } from "../pages/ManageDashboardPage";
import { ProfilePage } from "../pages/ProfilePage";
import { env } from "../support/env";
import { getIdvClaims } from "../support/idvApi";
import { TEST_USERS } from "../support/testUsers";

// Sign each test user in, check their Identity details on the profile page, and save
// the session for the test projects to reuse.
for (const user of Object.values(TEST_USERS)) {
  setup(`sign in as ${user.key}`, async ({ page }) => {
    // The frontend's PrivateRoute redirects to /v1/auth/login, which redirects to IBM Verify.
    await page.goto("/en");
    await new IbmVerifyLoginPage(page).login(user.email(), user.password());

    // IBM Verify -> backend /v1/auth/callback -> frontend dashboard (/en)
    await page.waitForURL((url) => url.href.startsWith(env.baseURL), {
      timeout: 30_000,
    });
    const dashboard = new ManageDashboardPage(page);
    await dashboard.expectLoaded();

    // Fail early with a clear error if the backend session isn't usable.
    await getIdvClaims(page.request);

    // Dashboard -> "Personal information" card -> /en/profile
    await dashboard.openPersonalInformation();
    const profile = new ProfilePage(page);
    await profile.expectLoaded();

    if (user.identityDetails) {
      await profile.provenInformation.expectDetails(user.identityDetails);
    } else {
      await profile.provenInformation.expectAbsent();
    }

    await page.context().storageState({ path: user.storageState });
  });
}
