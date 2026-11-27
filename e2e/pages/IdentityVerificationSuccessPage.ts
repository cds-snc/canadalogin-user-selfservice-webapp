import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";

/** /:language/identity-verification/:journeyType/online/bluink/confirmation */
export class IdentityVerificationSuccessPage {
  readonly heading: Locator;
  readonly continueButton: Locator;

  constructor(
    private readonly page: Page,
    private readonly language: Language = "en",
  ) {
    const t = copy[language].idv;
    this.heading = page.getByRole("heading", {
      level: 1,
      name: t.IdentityVerificationSuccess.heading,
    });
    this.continueButton = page.getByRole("button", {
      name: t.IdentityVerificationSuccess.continueButton,
    });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async continueToDetailsConfirmation() {
    await this.continueButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(
        `/${this.language}/identity-verification/start/details-confirmation$`,
      ),
    );
  }
}
