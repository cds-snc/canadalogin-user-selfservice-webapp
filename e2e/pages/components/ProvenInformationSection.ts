import { expect, type Locator, type Page } from "@playwright/test";
import { copy, formatProvenDate, type Language } from "../../support/i18n";
import type { IdvClaims } from "../../support/idvApi";

/**
 * "Identity details" heading + verified badge + ProvenInformationCard.
 * Rendered on both the details confirmation page and the profile page.
 */
export class ProvenInformationSection {
  readonly heading: Locator;
  readonly verifiedBadge: Locator;
  private readonly t: (typeof copy)[Language];

  constructor(
    private readonly page: Page,
    private readonly language: Language,
    /** Text the page puts before the date in the badge, e.g. "Verified" or "Verified on". */
    private readonly badgePrefix: string,
  ) {
    this.t = copy[language];
    this.heading = page.getByRole("heading", {
      level: 2,
      name: this.t.profile.ProfileHome.provenInformation,
      exact: true,
    });
    // Scoped to the section's header row: other profile sections also use .verifiedBadge.
    this.verifiedBadge = page
      .locator("gcds-grid.gridInline")
      .filter({ has: this.heading })
      .locator(".verifiedBadge");
  }

  /** Value rendered in the <gcds-text> that follows an <h3> label in the card. */
  field(label: string) {
    return this.page
      .locator("gcds-heading")
      .filter({
        has: this.page.getByRole("heading", {
          level: 3,
          name: label,
          exact: true,
        }),
      })
      .locator("xpath=following-sibling::gcds-text[1]");
  }

  get legalName() {
    return this.field(this.t.profile.ProvenInformationCard.name);
  }

  async expectPopulated(claims: IdvClaims) {
    const verificationTime = claims.verified_claims?.verification?.time;
    const { given_name, family_name } = claims.verified_claims?.claims ?? {};
    expect(
      verificationTime,
      "Test data problem: claims have no verification time",
    ).toBeTruthy();

    await expect(this.heading).toBeVisible();
    await expect(this.verifiedBadge).toHaveText(
      `${this.badgePrefix} ${formatProvenDate(verificationTime!, this.language)}`,
    );
    await expect(this.legalName).toHaveText(
      [given_name, family_name].filter(Boolean).join(" "),
    );
  }

  async expectAbsent() {
    await expect(this.heading).toHaveCount(0);
    await expect(this.verifiedBadge).toHaveCount(0);
    await expect(this.legalName).toHaveCount(0);
  }
}
