import { expect, test, type Page } from "@playwright/test";
import type { ProvenInformationSection } from "../../pages/components/ProvenInformationSection";
import { DetailsConfirmationPage } from "../../pages/DetailsConfirmationPage";
import { ManageDashboardPage } from "../../pages/ManageDashboardPage";
import { ProfilePage } from "../../pages/ProfilePage";
import { LANGUAGES, type Language } from "../../support/i18n";
import { getIdvClaims, type IdvClaims } from "../../support/idvApi";
import { TEST_USERS } from "../../support/testUsers";

// The details confirmation screen is populated for User A and empty for User B,
// and the "Identity details" card on the profile page shows the proven information.
const screens: {
  name: string;
  open: (page: Page, language: Language) => Promise<ProvenInformationSection>;
}[] = [
  {
    name: "details confirmation",
    open: async (page, language) => {
      const screen = new DetailsConfirmationPage(page, language);
      await screen.goto();
      return screen.provenInformation;
    },
  },
  {
    // Same path a user takes: dashboard -> "Personal information" card -> /profile.
    name: "profile (via dashboard)",
    open: async (page, language) => {
      const dashboard = new ManageDashboardPage(page, language);
      await dashboard.goto();
      await dashboard.openPersonalInformation();
      const profile = new ProfilePage(page, language);
      await profile.expectLoaded();
      return profile.provenInformation;
    },
  },
];

test.describe("Proven information card", () => {
  test.describe("user with fake ID proofing (User A)", () => {
    const user = TEST_USERS.proven;
    test.use({ storageState: user.storageState });

    let claims: IdvClaims;

    test.beforeEach(async ({ page }) => {
      claims = await getIdvClaims(page.request);
      expect(
        claims.status,
        `Test data problem: ${user.key} must have completed fake ID proofing`,
      ).toBe("verified");
    });

    for (const { name, open } of screens) {
      for (const language of LANGUAGES) {
        test(`${name}: shows the Identity details card [${language}]`, async ({
          page,
        }) => {
          const provenInformation = await open(page, language);
          await provenInformation.expectPopulated(claims);
        });
      }
    }
  });

  // Assumes User B's account has no ID proofing data.
  test.describe("user without ID proofing (User B)", () => {
    const user = TEST_USERS.unproven;
    test.use({ storageState: user.storageState });

    for (const { name, open } of screens) {
      for (const language of LANGUAGES) {
        test(`${name}: does not show the card [${language}]`, async ({
          page,
        }) => {
          const provenInformation = await open(page, language);
          await provenInformation.expectAbsent();
        });
      }
    }
  });
});
