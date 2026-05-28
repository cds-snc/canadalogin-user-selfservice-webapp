import { parsePhoneNumberFromString } from "libphonenumber-js";

const getLocalPhoneNumber = (phoneNumber: string, dialCode: string) => {
  const digitsOnly = phoneNumber.replace(/\D/g, "");

  if (!digitsOnly || !dialCode) {
    return digitsOnly;
  }

  return digitsOnly.startsWith(dialCode)
    ? digitsOnly.slice(dialCode.length)
    : digitsOnly;
};

export function getDisplayedPhoneNumber(phoneNumber: string, dialCode: string) {
  const trimmedPhoneNumber = phoneNumber.trim();

  if (!trimmedPhoneNumber || /^\+\d{1,4}$/.test(trimmedPhoneNumber)) {
    return "";
  }

  const parsedPhoneNumber = parsePhoneNumberFromString(trimmedPhoneNumber);

  if (parsedPhoneNumber?.nationalNumber) {
    return parsedPhoneNumber.nationalNumber;
  }

  return getLocalPhoneNumber(trimmedPhoneNumber, dialCode);
}

export function getStoredPhoneNumber(phoneNumber: string, dialCode: string) {
  const localPhoneNumber = getLocalPhoneNumber(phoneNumber, dialCode);

  return localPhoneNumber ? `+${dialCode}${localPhoneNumber}` : "";
}
