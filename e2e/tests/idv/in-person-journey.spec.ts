import { expect, test, type Response } from "@playwright/test";

import { CanadaPostBarcodePage } from "../../pages/CanadaPostBarcodePage";
import { CanadaPostIdDetailsPage } from "../../pages/CanadaPostIdDetailsPage";
import { CanadaPostSelectionPage } from "../../pages/CanadaPostSelectionPage";
import { IdentityVerificationStartPage } from "../../pages/IdentityVerificationStartPage";
import { InPersonProviderSelectionPage } from "../../pages/InPersonProviderSelectionPage";
import { ServiceCanadaCentreCodePage } from "../../pages/ServiceCanadaCentreCodePage";
import { ServiceCanadaCentreIdDetailsPage } from "../../pages/ServiceCanadaCentreIdDetailsPage";
import { ServiceCanadaCentreSelectionPage } from "../../pages/ServiceCanadaCentreSelectionPage";
import type { InPersonApplicant } from "../../pages/components/InPersonApplicantForm";
import { TEST_USERS } from "../../support/testUsers";

const applicant: InPersonApplicant & {
  dateOfBirthISO: string;
  dateOfBirthText: string;
} = {
  firstName: "Test",
  lastName: "InPerson",
  dateOfBirth: { month: "December", day: "2", year: "1995" },
  dateOfBirthISO: "1995-12-02",
  dateOfBirthText: "December 2, 1995",
  address: "123 Test Street",
  city: "Ottawa",
  province: { code: "ON", label: "Ontario" },
  postalCode: "K1A 0B1",
};

test.describe("In-person identity verification", () => {
  test.describe.configure({ mode: "serial" });

  test.describe("Service Canada Centre", () => {
    test.use({ storageState: TEST_USERS.inPerson.storageState });

    test("Service Canada Centre journey displays the generated code", async ({
      page,
    }) => {
      await new IdentityVerificationStartPage(page).chooseInPerson();
      await new InPersonProviderSelectionPage(page).choose(
        "serviceCanadaLocationsOption",
      );
      await new ServiceCanadaCentreSelectionPage(page).chooseDriverLicence();

      const detailsPage = new ServiceCanadaCentreIdDetailsPage(page);
      await detailsPage.fillApplicant(applicant);
      await expectCaseCreation(await detailsPage.submit(), "service_canada");

      await expect(page).toHaveURL(
        /\/en\/identity-verification\/start\/in-person\/service-canada-centre\/idv-code$/,
      );
      const codePage = new ServiceCanadaCentreCodePage(page);
      await expect(codePage.heading).toBeVisible();
      await expect(codePage.codeValue).toHaveText(/\S+/);
      await expect(codePage.informationHeading).toBeVisible();
      await expect(
        codePage.applicantValue(applicant.firstName),
      ).toBeVisible();
      await expect(
        codePage.applicantValue(applicant.lastName),
      ).toBeVisible();
      await expect(
        codePage.applicantValue(applicant.dateOfBirthText),
      ).toBeVisible();
    });
  });

  test.describe("Canada Post", () => {
    test.use({
      storageState: TEST_USERS.inPersonCanadaPost.storageState,
    });

    test("Canada Post journey displays the generated barcode", async ({
      page,
    }) => {
      await new IdentityVerificationStartPage(page).chooseInPerson();
      await new InPersonProviderSelectionPage(page).choose(
        "canadaPostLocationsOption",
      );
      await new CanadaPostSelectionPage(page).chooseDriverLicence();

      const detailsPage = new CanadaPostIdDetailsPage(page);
      await detailsPage.fillApplicant(applicant);
      await expectCaseCreation(await detailsPage.submit(), "canada_post");

      await expect(page).toHaveURL(
        /\/en\/identity-verification\/start\/in-person\/canada-post\/idv-code$/,
      );
      const barcodePage = new CanadaPostBarcodePage(page);
      await expect(barcodePage.heading).toBeVisible();
      await expect(barcodePage.barcode).toBeVisible();
      await expect(barcodePage.informationHeading).toBeVisible();
      await expect(
        barcodePage.applicantValue(applicant.firstName),
      ).toBeVisible();
      await expect(
        barcodePage.applicantValue(applicant.lastName),
      ).toBeVisible();
      await expect(
        barcodePage.applicantValue(applicant.dateOfBirthText),
      ).toBeVisible();
    });
  });
});

async function expectCaseCreation(
  response: Response,
  provider: "service_canada" | "canada_post",
) {
  expect(response.status()).toBe(201);
  expect(response.request().postDataJSON()).toMatchObject({
    verification_provider: provider,
    applicant: {
      first_name: applicant.firstName,
      last_name: applicant.lastName,
      date_of_birth: applicant.dateOfBirthISO,
      id_type: "driverLicence",
      address: { locality: applicant.city },
    },
  });
}
