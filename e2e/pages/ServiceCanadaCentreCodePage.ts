import { type Locator, type Page } from "@playwright/test";
import { copy } from "../support/i18n";

/** /:language/identity-verification/start/in-person/service-canada-centre/idv-code */
export class ServiceCanadaCentreCodePage {
  readonly heading: Locator;
  readonly codeValue: Locator;
  readonly informationHeading: Locator;

  constructor(private readonly page: Page) {
    const t = copy.en.idv.ServiceCanadaCentreCode;
    this.heading = page.getByRole("heading", { name: t.heading });
    this.codeValue = page.locator(".service-canada-code-value");
    this.informationHeading = page.getByRole("heading", {
      name: t.yourInformationHeading,
    });
  }

  applicantValue(value: string) {
    return this.page.getByText(value, { exact: true });
  }
}
