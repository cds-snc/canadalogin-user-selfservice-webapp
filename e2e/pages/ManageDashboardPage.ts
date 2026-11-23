import { expect, type Locator, type Page } from "@playwright/test";
import { copy, type Language } from "../support/i18n";
import { waitForClaimsResponse } from "../support/navigation";

/** /:language — the dashboard users land on after signing in. */
export class ManageDashboardPage {
  readonly personalInformationCard: Locator;

  constructor(
    private readonly page: Page,
    private readonly language: Language = "en",
  ) {
    // gcds-card renders its title as the link text.
    this.personalInformationCard = page.getByRole("link", {
      name: copy[language].dashboard.ManageDashboard.personalInfo,
      exact: true,
    });
  }

  async goto() {
    await this.page.goto(`/${this.language}`);
    await this.expectLoaded();
  }

  async expectLoaded() {
    await expect(this.personalInformationCard).toBeVisible();
  }

  /** Clicks the "Personal information" card and waits for the profile's IDV claims to load. */
  async openPersonalInformation() {
    const claimsResponse = waitForClaimsResponse(this.page);
    await this.personalInformationCard.click();
    await expect(this.page).toHaveURL(new RegExp(`/${this.language}/profile$`));
    await claimsResponse;
  }
}
