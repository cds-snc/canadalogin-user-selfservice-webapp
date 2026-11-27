import { expect, type Page } from "@playwright/test";
import { fillGcdsInput } from "../../support/fillGcdsInput";

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
  province: {
    code: string;
    label: string;
  };
  postalCode: string;
};

export class InPersonApplicantForm {
  constructor(private readonly page: Page) {}

  async fill(applicant: InPersonApplicant) {
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
    await fillGcdsInput(input, value);
    await input.press("Tab");
    await expect(input).toHaveValue(value);
  }

  private async fillDate(id: string, value: InPersonDate) {
    const dateInput = this.page.locator(`gcds-date-input#${id}`);
    const monthSelect = dateInput.getByRole("combobox");
    await expect(monthSelect).toHaveCount(1);
    await monthSelect.selectOption({ label: value.month });
    const dayInput = dateInput.getByRole("textbox", { name: "Day" });
    await fillGcdsInput(dayInput, value.day);
    await dayInput.press("Tab");
    const yearInput = dateInput.getByRole("textbox", { name: "Year" });
    await fillGcdsInput(yearInput, value.year);
    await yearInput.press("Tab");
  }
}
