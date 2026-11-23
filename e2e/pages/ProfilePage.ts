import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";
import { gotoAndWaitForClaims } from "../support/navigation";
import { ProvenInformationSection } from "./components/ProvenInformationSection";

/** /:language/profile */
export class ProfilePage {
  readonly pageHeading: Locator;
  readonly provenInformation: ProvenInformationSection;

  constructor(
    private readonly page: Page,
    private readonly language: Language = "en",
  ) {
    const t = copy[language];
    this.pageHeading = page.getByRole("heading", {
      level: 1,
      name: t.profile.ProfileHome.title,
    });
    this.provenInformation = new ProvenInformationSection(
      page,
      language,
      t.profile.ProfileHome.verifiedOn,
    );
  }

  async goto() {
    await gotoAndWaitForClaims(this.page, `/${this.language}/profile`);
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.pageHeading).toBeVisible();
  }
}
