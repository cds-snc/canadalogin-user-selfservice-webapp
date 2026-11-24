import { expect, type Page } from "@playwright/test";
import { copy } from "../support/i18n";

type ProviderOption =
  | "serviceCanadaLocationsOption"
  | "canadaPostLocationsOption";

const providerPaths: Record<ProviderOption, string> = {
  serviceCanadaLocationsOption: "service-canada-centre",
  canadaPostLocationsOption: "canada-post",
};

/** /:language/identity-verification/start/in-person */
export class InPersonProviderSelectionPage {
  constructor(private readonly page: Page) {}

  async choose(provider: ProviderOption) {
    const t = copy.en.idv;
    const label = t.StartIdentityProofing[provider];
    await this.page
      .locator("gcds-radios#prove-identity-in-person-radios")
      .getByText(label)
      .click();
    await this.page
      .getByRole("button", {
        name: t.ProveIdentityInPerson.continueButton,
      })
      .click();
    await expect(this.page).toHaveURL(
      new RegExp(
        `/en/identity-verification/start/in-person/${providerPaths[provider]}$`,
      ),
    );
  }
}
