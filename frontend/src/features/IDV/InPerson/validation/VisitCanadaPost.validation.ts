import {
  type DateOfBirthValidationError,
  getDateOfBirthValidationError,
  type InPersonSharedSummaryErrorCodes,
  isNonEmptyTrimmed,
  isValidName,
  type NameValidationError,
  type RequiredValidationError,
} from "./InPersonIdentity.validation";

const IDS_REQUIRING_ADDRESS_AND_PROVINCE = new Set([
  "driverLicence",
  "photoIDHealthCard",
  "photoIDServiceCard",
]);

export interface VisitCanadaPostFormData {
  idType: string;
  idExpiryDate: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  address: string;
  province: string;
}

export interface VisitCanadaPostSummaryErrorCodes extends InPersonSharedSummaryErrorCodes {
  idType?: RequiredValidationError;
  idExpiryDate?: RequiredValidationError;
  firstName?: NameValidationError;
  lastName?: NameValidationError;
}

export interface VisitCanadaPostValidationResult {
  isFormValid: boolean;
  hasSelectedIdType: boolean;
  showAddressAndProvinceFields: boolean;
  dateOfBirthValidationError: DateOfBirthValidationError | null;
  summaryErrorCodes: VisitCanadaPostSummaryErrorCodes;
}

export const requiresAddressAndProvince = (idType: string): boolean => {
  return IDS_REQUIRING_ADDRESS_AND_PROVINCE.has(idType);
};

export const getVisitCanadaPostValidation = (
  formData: VisitCanadaPostFormData,
): VisitCanadaPostValidationResult => {
  const summaryErrorCodes: VisitCanadaPostSummaryErrorCodes = {};
  const hasSelectedIdType = isNonEmptyTrimmed(formData.idType);
  const showAddressAndProvinceFields = requiresAddressAndProvince(
    formData.idType,
  );

  if (!hasSelectedIdType) {
    summaryErrorCodes.idType = "required";
  }

  if (hasSelectedIdType && !isNonEmptyTrimmed(formData.idExpiryDate)) {
    summaryErrorCodes.idExpiryDate = "required";
  }

  if (hasSelectedIdType && !isValidName(formData.firstName)) {
    summaryErrorCodes.firstName = "required_or_invalid";
  }

  if (hasSelectedIdType && !isValidName(formData.lastName)) {
    summaryErrorCodes.lastName = "required_or_invalid";
  }

  const dateOfBirthValidationError = hasSelectedIdType
    ? getDateOfBirthValidationError(formData.dateOfBirth)
    : null;

  if (dateOfBirthValidationError) {
    summaryErrorCodes.dateOfBirth = dateOfBirthValidationError;
  }

//  if (showAddressAndProvinceFields && !isNonEmptyTrimmed(formData.address)) {
//    summaryErrorCodes.address = "required";
//  }
//
//  if (showAddressAndProvinceFields && !isNonEmptyTrimmed(formData.province)) {
//    summaryErrorCodes.province = "required";
//  }

  return {
    isFormValid: Object.keys(summaryErrorCodes).length === 0,
    hasSelectedIdType,
    showAddressAndProvinceFields,
    dateOfBirthValidationError,
    summaryErrorCodes,
  };
};
