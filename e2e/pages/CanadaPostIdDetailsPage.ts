import { expect, type Page, type Response } from "@playwright/test";
import { copy } from "../support/i18n";
import { waitForInPersonCaseCreation } from "../support/idvApi";
import {
  InPersonApplicantForm,
  type InPersonApplicant,
} from "./components/InPersonApplicantForm";

/** /:language/identity-verification/start/in-person/canada-post/id-details */
export class CanadaPostIdDetailsPage {
  readonly heading;
  private readonly continueButton;

  constructor(private readonly page: Page) {
    const t = copy.en.idv;
    this.heading = page.getByRole("heading", {
      name: t.CanadaPostIdDetails.driverLicenceHeading,
    });
    this.continueButton = page.getByRole("button", {
      name: t.CanadaPostIdDetails.continueButton,
    });
  }

  async fillApplicant(applicant: InPersonApplicant) {
    await expect(this.heading).toBeVisible();
    await new InPersonApplicantForm(
      this.page,
      copy.en.idv.CanadaPostIdDetails.provinceLabel,
    ).fill(applicant);
  }

  async submit(): Promise<Response> {
    const response = waitForInPersonCaseCreation(this.page);
    await this.continueButton.click();
    return response;
  }
}
