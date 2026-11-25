import {
  type DateOfBirthValidationError,
  getDateOfBirthValidationError,
  isNonEmptyTrimmed,
  isValidName,
  type NameValidationError,
  type RequiredValidationError,
} from "./InPersonIdentity.validation";

const CANADIAN_POSTAL_CODE_PATTERN =
  /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] ?\d[ABCEGHJ-NPRSTV-Z]\d$/i;

export interface CanadaPostIdDetailsFormData {
  idExpiryDate?: string;
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
  showCountry?: boolean;
  showProvince: boolean;
}

// Id expiry remains a shared compatibility field for Service Canada/API consumers.
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

export const isValidCanadianPostalCode = (value: string): boolean =>
  CANADIAN_POSTAL_CODE_PATTERN.test(value.trim());

export const getCanadaPostIdDetailsValidation = (
  formData: CanadaPostIdDetailsFormData,
  { showCountry = false, showProvince }: CanadaPostIdDetailsFieldVisibility,
): CanadaPostIdDetailsValidationResult => {
  const errorCodes: CanadaPostIdDetailsErrorCodes = {};

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
