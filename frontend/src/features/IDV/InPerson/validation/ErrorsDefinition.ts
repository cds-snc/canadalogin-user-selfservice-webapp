type TranslateFn = (key: string) => string;

export type SharedDateOfBirthErrorCode =
  | "required"
  | "invalid"
  | "year"
  | "future";

export interface SharedDateOfBirthMessage {
  inline: string;
  summary: string;
}

export const getSharedDateOfBirthMessages = (
  t: TranslateFn,
): Record<SharedDateOfBirthErrorCode, SharedDateOfBirthMessage> => ({
  required: {
    inline: t("ErrorsDefinition.dobRequired"),
    summary: t("ErrorsDefinition.dobRequired"),
  },
  invalid: {
    inline: t("ErrorsDefinition.dobInvalid"),
    summary: t("ErrorsDefinition.dobInvalid"),
  },
  year: {
    inline: t("ErrorsDefinition.dobYear"),
    summary: t("ErrorsDefinition.dobYear"),
  },
  future: {
    inline: t("ErrorsDefinition.dobFuture"),
    summary: t("ErrorsDefinition.dobFuture"),
  },
});

export const getValidationSummaryHeading = (t: TranslateFn): string =>
  t("ErrorsDefinition.validationSummaryHeading");

export const getGivenNameRequiredOrInvalidMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.givenNameRequiredOrInvalid");

export const getFamilyNameRequiredOrInvalidMessage = (
  t: TranslateFn,
): string => t("ErrorsDefinition.familyNameRequiredOrInvalid");

export const getFirstNameRequiredOrInvalidMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.firstNameRequiredOrInvalid");

export const getLastNameRequiredOrInvalidMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.lastNameRequiredOrInvalid");

export const getAddressRequiredMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.addressRequired");

export const getProvinceRequiredMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.provinceRequired");

export const getCountryRequiredMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.countryRequired");

export const getIdTypeRequiredMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.idTypeRequired");

export const getIdExpiryRequiredMessage = (t: TranslateFn): string =>
  t("ErrorsDefinition.idExpiryRequired");