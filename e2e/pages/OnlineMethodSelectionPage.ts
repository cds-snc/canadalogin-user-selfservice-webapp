import { expect, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";

/** /:language/identity-verification/:journeyType/online */
export class OnlineMethodSelectionPage {
  constructor(
    private readonly page: Page,
    private readonly language: Language = "en",
  ) {}

  async chooseSelfPhotoAndIdCheck() {
    const t = copy[this.language].idv;
    const radios = this.page.locator(
      "gcds-radios#prove-identity-online-radios",
    );
    const option = t.StartIdentityProofing.documentScanningOption;
    const radio = radios.getByRole("radio", { name: option });
    await radios.getByText(option).click();
    await expect(radio).toBeChecked();
    await this.page
      .getByRole("button", { name: t.ProveIdentityOnline.continueButton })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(
        `/${this.language}/identity-verification/start/online/identity-verification-info$`,
      ),
    );
  }

  async chooseProvincialSignIn() {
    const t = copy[this.language].idv;
    const radios = this.page.locator(
      "gcds-radios#prove-identity-online-radios",
    );
    const option = t.StartIdentityProofing.provincialPartnerOption;
    const radio = radios.getByRole("radio", { name: option });
    await radios.getByText(option).click();
    await expect(radio).toBeChecked();
    await this.page
      .getByRole("button", { name: t.ProveIdentityOnline.continueButton })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(
        `/${this.language}/identity-verification/start/online/provincial$`,
      ),
    );
  }
}
