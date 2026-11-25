import { type Page } from "@playwright/test";
import { copy } from "../support/i18n";

/** /:language/identity-verification/start/in-person/service-canada-centre */
export class ServiceCanadaCentreSelectionPage {
  constructor(private readonly page: Page) {}

  async chooseDriverLicence() {
    const t = copy.en.idv.ServiceCanadaCentre;
    await this.page
      .locator("gcds-radios#select-id-radios")
      .getByText(t.documents.driverLicence.label)
      .click();
    await this.page
      .locator("gcds-radios#non-expired-id-radios")
      .getByText(t.yesOption)
      .click();
    await this.page
      .getByRole("button", { name: t.continueButton })
      .click();
  }
}
