import { expect, type Page, type Response } from "@playwright/test";
import { copy } from "../support/i18n";
import { waitForInPersonCaseCreation } from "../support/idvApi";
import {
  InPersonApplicantForm,
  type InPersonApplicant,
} from "./components/InPersonApplicantForm";

/** /:language/identity-verification/start/in-person/service-canada-centre/id-details */
export class ServiceCanadaCentreIdDetailsPage {
  readonly heading;
  private readonly continueButton;

  constructor(private readonly page: Page) {
    const t = copy.en.idv.ServiceCanadaCentre;
    this.heading = page.getByRole("heading", {
      name: "Enter your driver licence details",
    });
    this.continueButton = page.getByRole("button", {
      name: t.continueButton,
    });
  }

  async fillApplicant(applicant: InPersonApplicant) {
    await expect(this.heading).toBeVisible();
    await new InPersonApplicantForm(
      this.page,
      copy.en.idv.ServiceCanadaCentre.provinceLabel,
    ).fill(applicant);
  }

  async submit(): Promise<Response> {
    const response = waitForInPersonCaseCreation(this.page);
    await this.continueButton.click();
    return response;
  }
}
