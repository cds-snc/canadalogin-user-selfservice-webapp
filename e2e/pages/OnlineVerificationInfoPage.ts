import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";

/** /:language/identity-verification/:journeyType/online/identity-verification-info */
export class OnlineVerificationInfoPage {
  readonly heading: Locator;
  readonly continueButton: Locator;

  constructor(
    private readonly page: Page,
    language: Language = "en",
  ) {
    const t = copy[language].idv;
    this.heading = page.getByRole("heading", {
      level: 1,
      name: t.OnlineVerificationInfo.heading,
    });
    this.continueButton = page.getByRole("button", {
      name: t.OnlineVerificationInfo.continueButton,
    });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
  }

  async continue() {
    await this.continueButton.click();
  }
}
