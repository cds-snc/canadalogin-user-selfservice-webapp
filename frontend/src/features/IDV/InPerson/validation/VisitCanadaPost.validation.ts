import {
  type DateOfBirthValidationError,
  getDateOfBirthValidationError,
  type InPersonSharedSummaryErrorCodes,
  isNonEmptyTrimmed,
  isValidName,
  type NameValidationError,
  type RequiredValidationError,
} from "./InPersonIdentity.validation";

export interface VisitCanadaPostFormData {
  givenName: string;
  familyName: string;
  dateOfBirth: string;
  address: string;
  province: string;
  country: string;
}

export interface VisitCanadaPostSummaryErrorCodes extends InPersonSharedSummaryErrorCodes {
  givenName?: NameValidationError;
  familyName?: NameValidationError;
  country?: RequiredValidationError;
}

export interface VisitCanadaPostValidationResult {
  isFormValid: boolean;
  dateOfBirthValidationError: DateOfBirthValidationError | null;
  summaryErrorCodes: VisitCanadaPostSummaryErrorCodes;
}

export const getVisitCanadaPostValidation = (
  formData: VisitCanadaPostFormData,
): VisitCanadaPostValidationResult => {
  const summaryErrorCodes: VisitCanadaPostSummaryErrorCodes = {};

  if (!isValidName(formData.givenName)) {
    summaryErrorCodes.givenName = "required_or_invalid";
  }

  if (!isValidName(formData.familyName)) {
    summaryErrorCodes.familyName = "required_or_invalid";
  }

  const dateOfBirthValidationError = getDateOfBirthValidationError(
    formData.dateOfBirth,
  );
  if (dateOfBirthValidationError) {
    summaryErrorCodes.dateOfBirth = dateOfBirthValidationError;
  }

  if (!isNonEmptyTrimmed(formData.address)) {
    summaryErrorCodes.address = "required";
  }

  if (!isNonEmptyTrimmed(formData.province)) {
    summaryErrorCodes.province = "required";
  }

  if (!isNonEmptyTrimmed(formData.country)) {
    summaryErrorCodes.country = "required";
  }

  return {
    isFormValid: Object.keys(summaryErrorCodes).length === 0,
    dateOfBirthValidationError,
    summaryErrorCodes,
  };
};
