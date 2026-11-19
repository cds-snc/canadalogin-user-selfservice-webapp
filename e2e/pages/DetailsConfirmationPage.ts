import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";
import { gotoAndWaitForClaims } from "../support/navigation";
import { ProvenInformationSection } from "./components/ProvenInformationSection";

/** /:language/identity-verification[/:journeyType]/details-confirmation */
export class DetailsConfirmationPage {
  readonly pageHeading: Locator;
  readonly continueButton: Locator;
  readonly provenInformation: ProvenInformationSection;

  constructor(
    private readonly page: Page,
    private readonly language: Language = "en",
  ) {
    const t = copy[language];
    this.pageHeading = page.getByRole("heading", {
      level: 1,
      name: t.idv.ConfirmIdentityDetails.pageTitle,
    });
    this.continueButton = page.getByRole("button", {
      name: t.idv.ConfirmIdentityDetails.confirmAndContinue,
    });
    this.provenInformation = new ProvenInformationSection(
      page,
      language,
      t.profile.ProfileHome.verified,
    );
  }

  async goto(journeyType?: string) {
    const journey = journeyType ? `/${journeyType}` : "";
    await gotoAndWaitForClaims(
      this.page,
      `/${this.language}/identity-verification${journey}/details-confirmation`,
    );
    await expect(this.pageHeading).toBeVisible();
  }
}
