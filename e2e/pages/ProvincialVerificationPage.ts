import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";

/** /:language/identity-verification/:journeyType/online/provincial */
export class ProvincialVerificationPage {
  readonly heading: Locator;
  readonly bcServicesCard: Locator;
  readonly albertaAccountCard: Locator;
  readonly quebecAccountCard: Locator;

  constructor(
    private readonly page: Page,
    language: Language = "en",
  ) {
    const t = copy[language].idv.ProvincialVerification;
    this.heading = page.getByRole("heading", { level: 1, name: t.heading });
    this.bcServicesCard = page.getByRole("heading", {
      level: 3,
      name: t.bcServicesCard,
    });
    this.albertaAccountCard = page.getByRole("heading", {
      level: 3,
      name: t.albertaAccount,
    });
    this.quebecAccountCard = page.getByRole("heading", {
      level: 3,
      name: t.quebecAccount,
    });
  }

  async expectLoaded() {
    await expect(this.heading).toBeVisible();
    await expect(this.bcServicesCard).toBeVisible();
    await expect(this.albertaAccountCard).toBeVisible();
    await expect(this.quebecAccountCard).toBeVisible();
  }
}
