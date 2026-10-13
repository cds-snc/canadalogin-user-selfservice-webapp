import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";

const PAGES = [
  "",
  "profile",
  "profile/update-name",
  "profile/update-language",
  "profile/update-contact-phone",
  "profile/update-email",
  "security-settings",
  "security-settings/update-password",
  "security-settings/manage-2fa-verifications",
  "security-settings/manage-2fa-verifications/add-mfa-phone-number",
  "security-settings/manage-2fa-verifications/add-fido2",
  "connected-services",
  "identity-verification",
];

const LANGUAGES = ["en", "fr"];

const PROFILE = {
  id: "a11y-user",
  active: true,
  name: { givenName: "Alex", familyName: "Tester" },
  emails: [{ value: "alex.tester@example.com", type: "work" }],
  phoneNumbers: [{ value: "+16135550123", type: "mobile" }],
  details: {
    emailVerified: true,
    lastLogin: "2026-01-01T12:00:00Z",
    lastMFA: null,
    twoFactorAuthentication: true,
    pwdChangedTime: "2026-01-01T12:00:00Z",
  },
};

const CONNECTED_SERVICES = [
  {
    clientId: "svc-1",
    name: "Example Service",
    url: "https://example.com",
    lastLogin: "2026-01-01T12:00:00Z",
    lastLogout: null,
  },
];

async function mockBackend(page: Page) {
  await page.route("**/v1/**", (route) => {
    const { pathname } = new URL(route.request().url());
    if (pathname.endsWith("/auth/session-status")) {
      return route.abort();
    }
    let body: unknown = { data: {} };
    if (pathname.endsWith("/users/profile")) {
      body = { data: PROFILE };
    } else if (pathname.endsWith("/users/connected-services")) {
      body = { services: CONNECTED_SERVICES };
    }
    return route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });
}

test.beforeEach(async ({ page }) => {
  await mockBackend(page);
});

for (const lang of LANGUAGES) {
  for (const path of PAGES) {
    const url = `/${lang}${path ? `/${path}` : ""}`;

    test(`${url} has no axe violations`, async ({ page }) => {
      await page.goto(url);
      await page.locator("h1").first().waitFor();

      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
        .analyze();

      expect(
        results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target.join(" ")),
        })),
      ).toEqual([]);
    });
  }
}
