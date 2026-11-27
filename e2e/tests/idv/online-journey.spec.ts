import { expect, test } from "@playwright/test";

import { DetailsConfirmationPage } from "../../pages/DetailsConfirmationPage";
import { IdentityVerificationStartPage } from "../../pages/IdentityVerificationStartPage";
import { IdentityVerificationSuccessPage } from "../../pages/IdentityVerificationSuccessPage";
import { OnlineMethodSelectionPage } from "../../pages/OnlineMethodSelectionPage";
import { OnlineVerificationInfoPage } from "../../pages/OnlineVerificationInfoPage";
import { ProvincialVerificationPage } from "../../pages/ProvincialVerificationPage";
import { env } from "../../support/env";
import { LANGUAGES, type Language } from "../../support/i18n";
import { TEST_USERS } from "../../support/testUsers";

test.describe("Online identity verification journey", () => {
  test.use({ storageState: TEST_USERS.unproven.storageState });

  test.describe("Self-photo and ID check", () => {
    for (const language of LANGUAGES) {
      test(`reaches the confirmation screen [${language}]`, async ({
        page,
      }) => {
        const successUrl = new URL(
          `/${language}/identity-verification/start/online/bluink/confirmation`,
          env.baseURL,
        ).href;

        // Simulate the provider returning the user to the app after verification.
        await page.route(
          `${env.apiURL}/v1/identity-verification/online`,
          async (route) => {
            expect(route.request().method()).toBe("POST");
            await route.fulfill({
              status: 201,
              json: {
                success: true,
                message: "Online identity verification case created",
                data: {
                  case_id: "e2e-online-case",
                  status: "pending",
                  online_verification_url: successUrl,
                },
              },
            });
          },
        );

        await new IdentityVerificationStartPage(page).chooseOnline(language);
        await new OnlineMethodSelectionPage(
          page,
          language,
        ).chooseSelfPhotoAndIdCheck();

        const infoPage = new OnlineVerificationInfoPage(page, language);
        await infoPage.expectLoaded();

        const caseCreation = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname.endsWith(
              "/v1/identity-verification/online",
            ) && response.request().method() === "POST",
        );
        await infoPage.continue();
        const response = await caseCreation;
        expect(response.status()).toBe(201);
        expect(response.request().postDataJSON()).toEqual({});
        await expect(page).toHaveURL(successUrl);

        const successPage = new IdentityVerificationSuccessPage(
          page,
          language,
        );
        await successPage.expectLoaded();
        await successPage.continueToDetailsConfirmation();

        const confirmationPage = new DetailsConfirmationPage(page, language);
        await expect(confirmationPage.pageHeading).toBeVisible();
      });
    }
  });

  test.describe("Provincial sign-in", () => {
    for (const language of LANGUAGES) {
      test(`displays partner choices [${language}]`, async ({ page }) => {
        await new IdentityVerificationStartPage(page).chooseOnline(language);
        await new OnlineMethodSelectionPage(
          page,
          language,
        ).chooseProvincialSignIn();

        await new ProvincialVerificationPage(page, language).expectLoaded();
      });
    }
  });
});
