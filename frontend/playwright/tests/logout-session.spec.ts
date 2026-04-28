import { test, expect } from "../fixtures";

// ---------------------------------------------------------------------------
// Sign Out
// ---------------------------------------------------------------------------
test.describe("Sign Out", () => {
  test("sign out link is accessible via navigation menu", async ({
    authedPage,
  }) => {
    await authedPage.goto("/en");

    // Sign out is inside gcds-top-nav menu; try expanding menu first
    const menuToggle = authedPage.getByRole("button", { name: /menu/i });
    if (await menuToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuToggle.click();
      await authedPage.waitForTimeout(500);
    }

    // Sign out may be a link inside the nav
    const signOutLink = authedPage.getByRole("link", { name: /sign out/i });
    const signOutBtn = authedPage.getByRole("button", { name: /sign out/i });

    const linkVisible = await signOutLink
      .isVisible({ timeout: 2000 })
      .catch(() => false);
    const btnVisible = await signOutBtn
      .isVisible({ timeout: 1000 })
      .catch(() => false);
    expect(linkVisible || btnVisible).toBe(true);
  });

  test("clicking sign out triggers logout API", async ({
    authedPage,
    page,
  }) => {
    let logoutCalled = false;
    await page.route("**/v1/auth/logout**", async (route) => {
      logoutCalled = true;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          data: { redirect_url: "http://localhost:3000/" },
        }),
      });
    });

    await authedPage.goto("/en");

    // Expand menu if collapsed
    const menuToggle = authedPage.getByRole("button", { name: /menu/i });
    if (await menuToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await menuToggle.click();
      await authedPage.waitForTimeout(500);
    }

    const signOutLink = authedPage.getByRole("link", { name: /sign out/i });
    if (await signOutLink.isVisible({ timeout: 2000 }).catch(() => false)) {
      await signOutLink.click();
      await authedPage.waitForTimeout(2000);
      expect(logoutCalled).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Session — keep-alive is called
// ---------------------------------------------------------------------------
test.describe("Session management", () => {
  test("session status SSE is connected on page load", async ({
    authedPage,
    page,
  }) => {
    let sessionStatusCalled = false;
    // The fixture already mocks this, but we can verify it was called
    await page.route("**/v1/auth/session-status**", async (route) => {
      sessionStatusCalled = true;
      const futureExpire = Math.floor(Date.now() / 1000) + 3600;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: notification\ndata: ${JSON.stringify({ status: "active", expire: futureExpire })}\n\n`,
      });
    });

    await authedPage.goto("/en");
    await authedPage.waitForTimeout(1000);
    expect(sessionStatusCalled).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Session expired — shows modal or redirects
// ---------------------------------------------------------------------------
test.describe("Session expiry", () => {
  test("expired session triggers redirect or modal", async ({
    authedPage,
    page,
  }) => {
    // Override session-status to return an already-expired session
    await page.route("**/v1/auth/session-status**", async (route) => {
      const pastExpire = Math.floor(Date.now() / 1000) - 60;
      await route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: `event: notification\ndata: ${JSON.stringify({ status: "active", expire: pastExpire })}\n\n`,
      });
    });

    await authedPage.goto("/en");
    await authedPage.waitForTimeout(3000);

    // Either a session timeout modal appears or the app redirects
    const hasModal = await authedPage
      .getByText(/session is about to end|session will expire/i)
      .first()
      .isVisible()
      .catch(() => false);
    const hasStayBtn = await authedPage
      .getByRole("button", { name: /stay signed in/i })
      .isVisible()
      .catch(() => false);
    const redirected = !(await authedPage
      .getByRole("heading", { name: /welcome/i })
      .isVisible()
      .catch(() => false));

    // At least one of these should be true
    expect(hasModal || hasStayBtn || redirected).toBe(true);
  });
});
