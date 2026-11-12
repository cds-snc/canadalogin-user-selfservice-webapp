import {
  type DateOfBirthValidationError,
  getDateOfBirthValidationError,
  isNonEmptyTrimmed,
  isValidName,
  type NameValidationError,
  type RequiredValidationError,
} from "./InPersonIdentity.validation";

export const MIN_ID_VALIDITY_MONTHS = 1;

const CANADIAN_POSTAL_CODE_PATTERN =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

export interface CanadaPostIdDetailsFormData {
  idExpiryDate: string;
  documentOptionId: string;
  country: string;
  province: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  cityTown: string;
  postalCode: string;
}

export interface CanadaPostIdDetailsFieldVisibility {
  showCountry: boolean;
  showProvince: boolean;
}

export type IdExpiryValidationError = "required" | "invalid" | "too_soon";
export type PostalCodeValidationError = "required_or_invalid";

export interface CanadaPostIdDetailsErrorCodes {
  idExpiryDate?: IdExpiryValidationError;
  documentOptionId?: RequiredValidationError;
  country?: RequiredValidationError;
  province?: RequiredValidationError;
  firstName?: NameValidationError;
  lastName?: NameValidationError;
  dateOfBirth?: DateOfBirthValidationError;
  address?: RequiredValidationError;
  cityTown?: RequiredValidationError;
  postalCode?: PostalCodeValidationError;
}

export interface CanadaPostIdDetailsValidationResult {
  isFormValid: boolean;
  errorCodes: CanadaPostIdDetailsErrorCodes;
}

const toUtcDate = (value: string): Date | null => {
  const match = ISO_DATE_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const [year, month, day] = match.slice(1).map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
};

export const getIdExpiryValidationError = (
  value: string,
  today: Date = new Date(),
): IdExpiryValidationError | null => {
  if (!isNonEmptyTrimmed(value)) {
    return "required";
  }

  const expiry = toUtcDate(value);
  if (!expiry) {
    return "invalid";
  }

  const minimumExpiry = new Date(
    Date.UTC(
      today.getFullYear(),
      today.getMonth() + MIN_ID_VALIDITY_MONTHS,
      today.getDate(),
    ),
  );

  return expiry < minimumExpiry ? "too_soon" : null;
};

export const isValidCanadianPostalCode = (value: string): boolean =>
  CANADIAN_POSTAL_CODE_PATTERN.test(value.trim());

export const getCanadaPostIdDetailsValidation = (
  formData: CanadaPostIdDetailsFormData,
  { showCountry, showProvince }: CanadaPostIdDetailsFieldVisibility,
  today: Date = new Date(),
): CanadaPostIdDetailsValidationResult => {
  const errorCodes: CanadaPostIdDetailsErrorCodes = {};

  const idExpiryError = getIdExpiryValidationError(
    formData.idExpiryDate,
    today,
  );
  if (idExpiryError) {
    errorCodes.idExpiryDate = idExpiryError;
  }

  if (!isNonEmptyTrimmed(formData.documentOptionId)) {
    errorCodes.documentOptionId = "required";
  }

  if (showCountry && !isNonEmptyTrimmed(formData.country)) {
    errorCodes.country = "required";
  }

  if (showProvince && !isNonEmptyTrimmed(formData.province)) {
    errorCodes.province = "required";
  }

  if (!isValidName(formData.firstName)) {
    errorCodes.firstName = "required_or_invalid";
  }

  if (!isValidName(formData.lastName)) {
    errorCodes.lastName = "required_or_invalid";
  }

  const dateOfBirthError = getDateOfBirthValidationError(formData.dateOfBirth);
  if (dateOfBirthError) {
    errorCodes.dateOfBirth = dateOfBirthError;
  }

  if (!isNonEmptyTrimmed(formData.address)) {
    errorCodes.address = "required";
  }

  if (!isNonEmptyTrimmed(formData.cityTown)) {
    errorCodes.cityTown = "required";
  }

  if (!isValidCanadianPostalCode(formData.postalCode)) {
    errorCodes.postalCode = "required_or_invalid";
  }

  return {
    isFormValid: Object.keys(errorCodes).length === 0,
    errorCodes,
  };
};
