import { type Page } from "@playwright/test";
import { copy } from "../support/i18n";

/** /:language/identity-verification/start/in-person/canada-post */
export class CanadaPostSelectionPage {
  constructor(private readonly page: Page) {}

  async chooseDriverLicence() {
    const t = copy.en.idv;
    await this.page
      .locator("gcds-radios#select-id-radios")
      .getByText(t.CanadaPostSelectId.documents.DRIVERS_LICENCE.label)
      .click();
    await this.page
      .locator("gcds-radios#non-expired-id-radios")
      .getByText(t.VisitCanadaPost.yesOption)
      .click();
    await this.page
      .getByRole("button", {
        name: t.VisitCanadaPost.continueButton,
      })
      .click();
  }
}
