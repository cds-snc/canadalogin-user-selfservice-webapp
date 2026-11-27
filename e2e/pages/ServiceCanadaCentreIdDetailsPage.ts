import {
  expect,
  type Locator,
  type Page,
  type Response,
} from "@playwright/test";
import { copy } from "../support/i18n";
import { waitForInPersonCaseCreation } from "../support/idvApi";
import {
  InPersonApplicantForm,
  type InPersonApplicant,
} from "./components/InPersonApplicantForm";

/** /:language/identity-verification/start/in-person/service-canada-centre/id-details */
export class ServiceCanadaCentreIdDetailsPage {
  readonly heading: Locator;
  private readonly continueButton: Locator;

  constructor(private readonly page: Page) {
    const t = copy.en.idv.ServiceCanadaCentre;
    this.heading = page.getByRole("heading", {
      name: "Enter your Driver's Licence details",
    });
    this.continueButton = page.getByRole("button", {
      name: t.continueButton,
    });
  }

  async fillApplicant(applicant: InPersonApplicant) {
    await expect(this.heading).toBeVisible();
    await this.page
      .locator("gcds-select#select-province")
      .getByRole("combobox")
      .selectOption(applicant.province.code);
    await new InPersonApplicantForm(this.page).fill(applicant);
  }

  async submit(): Promise<Response> {
    const response = waitForInPersonCaseCreation(this.page);
    await this.continueButton.click();
    return response;
  }
}
