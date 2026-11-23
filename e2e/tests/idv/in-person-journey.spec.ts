import { expect, test, type Page } from "@playwright/test";

import { TEST_USERS } from "../../support/testUsers";
import { copy } from "../../support/i18n";

const user = TEST_USERS.inPerson;
const idvCopy = copy.en.idv;
const applicant = {
  firstName: "Test",
  lastName: "InPerson",
  month: "December",
  day: "2",
  year: "1995",
  dateOfBirth: "December 2, 1995",
  address: "123 Test Street",
  city: "Ottawa",
  province: "ON",
  postalCode: "K1A 0B1",
  idExpiryMonth: "December",
  idExpiryDay: "31",
  idExpiryYear: "2035",
};

test.describe("In-person identity verification", () => {
  test.describe.configure({ mode: "serial" });
  test.use({ storageState: user.storageState });

  test("Service Canada Centre journey displays the generated code", async ({
    page,
  }) => {
    await startInPersonJourney(page, "serviceCanadaLocationsOption");

    await selectRadio(
      page,
      "select-id-radios",
      idvCopy.ServiceCanadaCentre.documents.driverLicence.label,
    );
    await selectRadio(
      page,
      "non-expired-id-radios",
      idvCopy.ServiceCanadaCentre.yesOption,
    );
    await page
      .getByRole("button", {
        name: idvCopy.ServiceCanadaCentre.continueButton,
      })
      .click();

    await expect(page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person\/service-canada-centre\/id-details$/,
    );
    await expect(
      page.getByRole("heading", {
        name: "Enter your driver licence details",
      }),
    ).toBeVisible();

    await fillText(page, "first-name-input", applicant.firstName);
    await fillText(page, "last-name-input", applicant.lastName);
    await fillDate(page, "date-of-birth-input", {
      month: applicant.month,
      day: applicant.day,
      year: applicant.year,
    });
    await fillText(page, "address-input", applicant.address);
    await fillText(page, "city-town-input", applicant.city);
    await page
      .getByRole("combobox", {
        name: idvCopy.ServiceCanadaCentre.provinceLabel,
      })
      .selectOption(applicant.province);
    await fillText(page, "postal-code-input", applicant.postalCode);

    const createCase = waitForInPersonCaseCreation(page);
    await page
      .getByRole("button", {
        name: idvCopy.ServiceCanadaCentre.continueButton,
      })
      .click();
    await expectCaseCreation(await createCase, "service_canada");

    await expect(page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person\/service-canada-centre\/idv-code$/,
    );
    await expect(
      page.getByRole("heading", {
        name: idvCopy.ServiceCanadaCentreCode.heading,
      }),
    ).toBeVisible();
    await expect(page.locator(".service-canada-code-value")).toHaveText(/\S+/);
    await expect(
      page.getByRole("heading", {
        name: idvCopy.ServiceCanadaCentreCode.yourInformationHeading,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.firstName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.lastName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.dateOfBirth, { exact: true }),
    ).toBeVisible();
  });

  test("Canada Post journey displays the generated barcode", async ({
    page,
  }) => {
    await startInPersonJourney(page, "canadaPostLocationsOption");

    await expect(page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person\/canada-post$/,
    );
    await selectRadio(
      page,
      "select-id-radios",
      idvCopy.CanadaPostSelectId.documents.DRIVERS_LICENCE.label,
    );
    await selectRadio(
      page,
      "non-expired-id-radios",
      idvCopy.VisitCanadaPost.yesOption,
    );
    await page
      .getByRole("button", { name: idvCopy.VisitCanadaPost.continueButton })
      .click();

    await expect(page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person\/canada-post\/id-details$/,
    );
    await expect(
      page.getByRole("heading", {
        name: idvCopy.CanadaPostIdDetails.driverLicenceHeading,
      }),
    ).toBeVisible();

    await page
      .getByRole("combobox", {
        name: idvCopy.CanadaPostIdDetails.provinceLabel,
      })
      .selectOption({ label: "Ontario" });
    await fillDate(page, "id-expiry-date-input", {
      month: applicant.idExpiryMonth,
      day: applicant.idExpiryDay,
      year: applicant.idExpiryYear,
    });
    await fillText(page, "first-name-input", applicant.firstName);
    await fillText(page, "last-name-input", applicant.lastName);
    await fillDate(page, "date-of-birth-input", {
      month: applicant.month,
      day: applicant.day,
      year: applicant.year,
    });
    await fillText(page, "address-input", applicant.address);
    await fillText(page, "city-town-input", applicant.city);
    await fillText(page, "postal-code-input", applicant.postalCode);

    const createCase = waitForInPersonCaseCreation(page);
    await page
      .getByRole("button", {
        name: idvCopy.CanadaPostIdDetails.continueButton,
      })
      .click();
    await expectCaseCreation(await createCase, "canada_post");

    await expect(page).toHaveURL(
      /\/en\/identity-verification\/start\/in-person\/canada-post\/idv-code$/,
    );
    await expect(
      page.getByRole("heading", {
        name: idvCopy.ProofingBarcodeCanadaPost.heading,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("img", {
        name: /^Barcode for code .+/,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", {
        name: idvCopy.ProofingBarcodeCanadaPost.yourInformationHeading,
      }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.firstName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.lastName, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(applicant.dateOfBirth, { exact: true }),
    ).toBeVisible();
  });
});

async function startInPersonJourney(
  page: Page,
  providerOption: "serviceCanadaLocationsOption" | "canadaPostLocationsOption",
) {
  await page.goto("/en/identity-verification/start");
  await selectRadio(
    page,
    "start-identity-proofing-radios",
    idvCopy.StartIdentityProofing.inPersonSignBackInOption,
  );
  await page
    .getByRole("button", {
      name: idvCopy.ServiceCanadaCentre.continueButton,
    })
    .click();

  await expect(page).toHaveURL(
    /\/en\/identity-verification\/start\/in-person$/,
  );
  const providerLabel = idvCopy.StartIdentityProofing[providerOption];
  await selectRadio(page, "prove-identity-in-person-radios", providerLabel);
  await page
    .getByRole("button", { name: idvCopy.ProveIdentityInPerson.continueButton })
    .click();
}

async function selectRadio(page: Page, groupId: string, label: string) {
  // GCDS radio labels overlay their native inputs, so click the visible label.
  await page.locator(`gcds-radios#${groupId}`).getByText(label).click();
}

function waitForInPersonCaseCreation(page: Page) {
  return page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname.endsWith(
        "/v1/identity-verification/in-person",
      ) && response.request().method() === "POST",
  );
}

async function expectCaseCreation(
  response: Awaited<ReturnType<typeof waitForInPersonCaseCreation>>,
  provider: "service_canada" | "canada_post",
) {
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toMatchObject({
    verification_provider: provider,
    applicant: {
      first_name: applicant.firstName,
      last_name: applicant.lastName,
      date_of_birth: "1995-12-02",
      id_type: "driverLicence",
    },
  });
}

async function fillText(page: Page, id: string, value: string) {
  const input = page.locator(`gcds-input#${id}`).getByRole("textbox");
  await input.fill(value);
  await input.press("Tab");
}

async function fillDate(
  page: Page,
  id: string,
  value: { month: string; day: string; year: string },
) {
  const dateInput = page.locator(`gcds-date-input#${id}`);
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
