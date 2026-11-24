import { expect, type Page } from "@playwright/test";

export type InPersonDate = {
  month: string;
  day: string;
  year: string;
};

export type InPersonApplicant = {
  firstName: string;
  lastName: string;
  dateOfBirth: InPersonDate;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  idExpiryDate?: InPersonDate;
};

export class InPersonApplicantForm {
  constructor(
    private readonly page: Page,
    private readonly provinceLabel: string,
  ) {}

  async fill(applicant: InPersonApplicant) {
    await this.page
      .getByRole("combobox", { name: this.provinceLabel })
      .selectOption(applicant.province);

    if (applicant.idExpiryDate) {
      await this.fillDate("id-expiry-date-input", applicant.idExpiryDate);
    }

    await this.fillText("first-name-input", applicant.firstName);
    await this.fillText("last-name-input", applicant.lastName);
    await this.fillDate("date-of-birth-input", applicant.dateOfBirth);
    await this.fillText("address-input", applicant.address);
    await this.fillText("city-town-input", applicant.city);
    await this.fillText("postal-code-input", applicant.postalCode);
  }

  private async fillText(id: string, value: string) {
    const input = this.page
      .locator(`gcds-input#${id}`)
      .getByRole("textbox");
    await input.fill(value);
    await input.press("Tab");
    await expect(input).toHaveValue(value);
  }

  private async fillDate(id: string, value: InPersonDate) {
    const dateInput = this.page.locator(`gcds-date-input#${id}`);
    await dateInput
      .getByRole("combobox", { name: "Month" })
      .selectOption({ label: value.month });
    const dayInput = dateInput.getByRole("textbox", { name: "Day" });
    await dayInput.fill(value.day);
    await dayInput.press("Tab");
    const yearInput = dateInput.getByRole("textbox", { name: "Year" });
    await yearInput.fill(value.year);
    await yearInput.press("Tab");
  }
}
