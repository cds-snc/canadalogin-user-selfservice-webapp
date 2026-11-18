import { test as setup } from "@playwright/test";
import { IbmVerifyLoginPage } from "../pages/IbmVerifyLoginPage";
import { env } from "../support/env";
import { getIdvClaims } from "../support/idvApi";
import { TEST_USERS } from "../support/testUsers";

// Sign each test user in once and save the session for the test projects to reuse.
for (const user of Object.values(TEST_USERS)) {
  setup(`sign in as ${user.key}`, async ({ page }) => {
    // The frontend's PrivateRoute redirects to /v1/auth/login, which redirects to IBM Verify.
    await page.goto("/en");
    await new IbmVerifyLoginPage(page).login(user.email(), user.password());

    // IBM Verify -> backend /v1/auth/callback -> frontend
    await page.waitForURL((url) => url.href.startsWith(env.baseURL), {
      timeout: 30_000,
    });

    // Fail here, not in every test, if the backend session isn't usable.
    await getIdvClaims(page.request);

    await page.context().storageState({ path: user.storageState });
  });
}
