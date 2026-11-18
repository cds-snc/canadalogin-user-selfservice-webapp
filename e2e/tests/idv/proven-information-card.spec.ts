import { expect, test, type Page } from "@playwright/test";
import type { ProvenInformationSection } from "../../pages/components/ProvenInformationSection";
import { DetailsConfirmationPage } from "../../pages/DetailsConfirmationPage";
import { ProfilePage } from "../../pages/ProfilePage";
import { LANGUAGES, type Language } from "../../support/i18n";
import {
  getIdvClaims,
  resetIdvData,
  type IdvClaims,
} from "../../support/idvApi";
import { TEST_USERS } from "../../support/testUsers";

// The details confirmation screen is populated for User A and empty for User B,
// and the proven information card shows the verified date.
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
    name: "profile",
    open: async (page, language) => {
      const screen = new ProfilePage(page, language);
      await screen.goto();
      return screen.provenInformation;
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
        test(`${name}: shows legal name and verified date [${language}]`, async ({
          page,
        }) => {
          const provenInformation = await open(page, language);
          await provenInformation.expectPopulated(claims);
        });
      }
    }
  });

  test.describe("user without ID proofing (User B)", () => {
    const user = TEST_USERS.unproven;
    test.use({ storageState: user.storageState });

    test.beforeAll(async () => {
      const wasReset = await resetIdvData(user);
      if (!wasReset) {
        test.info().annotations.push({
          type: "warning",
          description:
            "IDV admin credentials not set; relying on existing test data for User B.",
        });
      }
    });

    test.beforeEach(async ({ page }) => {
      const claims = await getIdvClaims(page.request);
      expect(
        claims.status,
        `Test data problem: ${user.key} must not have completed ID proofing. Set the E2E_IDV_ADMIN_* variables to reset it automatically.`,
      ).not.toBe("verified");
    });

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
