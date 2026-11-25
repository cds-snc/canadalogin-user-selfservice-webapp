import { type Locator, type Page } from "@playwright/test";
import { copy } from "../support/i18n";

/** /:language/identity-verification/start/in-person/canada-post/idv-code */
export class CanadaPostBarcodePage {
  readonly heading: Locator;
  readonly barcode: Locator;
  readonly informationHeading: Locator;

  constructor(private readonly page: Page) {
    const t = copy.en.idv.ProofingBarcodeCanadaPost;
    this.heading = page.getByRole("heading", { name: t.heading });
    this.barcode = page.getByRole("img", { name: /^Barcode for code .+/ });
    this.informationHeading = page.getByRole("heading", {
      name: t.yourInformationHeading,
    });
  }

  applicantValue(value: string) {
    return this.page.getByText(value, { exact: true });
  }
}
