import { expect, type Locator, type Page } from "@playwright/test";
import {
  copy,
  formatBirthDate,
  formatProvenDate,
  type Language,
} from "../../support/i18n";
import type { IdvClaims } from "../../support/idvApi";

/** Text expected in the "Identity details" card. */
export type IdentityDetails = {
  /** Date in the badge, without the "Verified on" prefix. */
  verifiedOn: string;
  legalName: string;
  /** Omit when the card should not show the row. */
  dateOfBirth?: string;
  sourceOfInformation?: string;
};

/**
 * "Identity details" heading + verified badge + ProvenInformationCard.
 * Rendered on both the details confirmation page and the profile page.
 */
export class ProvenInformationSection {
  readonly heading: Locator;
  readonly verifiedBadge: Locator;
  readonly updateInformationText: Locator;
  readonly updateInformationLink: Locator;
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
    // "To update this information, you'll need to complete identity proofing again."
    this.updateInformationText = page.getByText(
      this.t.profile.ProvenInformationCard.updateInfo,
      { exact: true },
    );
    this.updateInformationLink = page.getByRole("link", {
      name: this.t.profile.ProvenInformationCard.updateButton,
      exact: true,
    });
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

  get dateOfBirth() {
    return this.field(this.t.profile.ProvenInformationCard.dateOfBirth);
  }

  get sourceOfInformation() {
    return this.field(this.t.profile.ProvenInformationCard.sourceOfInformation);
  }

  async expectPopulated(claims: IdvClaims) {
    const verificationTime = claims.verified_claims?.verification?.time;
    const { given_name, family_name, birthdate } =
      claims.verified_claims?.claims ?? {};
    const source =
      claims.source_display?.documents?.[0]?.display_name?.[this.language];
    expect(
      verificationTime,
      "Test data problem: claims have no verification time",
    ).toBeTruthy();

    await this.expectDetails({
      verifiedOn: formatProvenDate(verificationTime!, this.language),
      legalName: [given_name, family_name].filter(Boolean).join(" "),
      dateOfBirth: birthdate
        ? formatBirthDate(birthdate, this.language)
        : undefined,
      sourceOfInformation: source ?? undefined,
    });
  }

  /** Checks the card shows exactly these values. */
  async expectDetails(expected: IdentityDetails) {
    await expect(this.heading).toBeVisible();
    await expect(this.verifiedBadge).toHaveText(
      `${this.badgePrefix} ${expected.verifiedOn}`,
    );
    await expect(this.legalName).toHaveText(expected.legalName);
    // The card hides these rows when the data is missing, so mirror that.
    if (expected.dateOfBirth) {
      await expect(this.dateOfBirth).toHaveText(expected.dateOfBirth);
    } else {
      await expect(this.dateOfBirth).toHaveCount(0);
    }
    if (expected.sourceOfInformation) {
      await expect(this.sourceOfInformation).toHaveText(
        expected.sourceOfInformation,
      );
    } else {
      await expect(this.sourceOfInformation).toHaveCount(0);
    }
    await expect(this.updateInformationLink).toBeVisible();
  }

  async expectAbsent() {
    await expect(this.heading).toHaveCount(0);
    await expect(this.verifiedBadge).toHaveCount(0);
    await expect(this.legalName).toHaveCount(0);
    await expect(this.updateInformationLink).toHaveCount(0);
  }
}
