import { expect, type Page } from "@playwright/test";
import { copy } from "../support/i18n";

/** /:language/identity-verification/start */
export class IdentityVerificationStartPage {
  constructor(private readonly page: Page) {}

  async chooseInPerson() {
    const t = copy.en.idv;
    await this.page.goto("/en/identity-verification/start");
    await this.page
      .locator("gcds-radios#start-identity-proofing-radios")
      .getByText(t.StartIdentityProofing.inPersonSignBackInOption)
      .click();
    await this.page
      .getByRole("button", {
        name: t.ServiceCanadaCentre.continueButton,
      })
      .click();
    await expect(this.page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person$/,
    );
  }
}
