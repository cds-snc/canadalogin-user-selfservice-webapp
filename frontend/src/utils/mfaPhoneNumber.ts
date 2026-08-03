import { parsePhoneNumberFromString } from "libphonenumber-js";

const getLocalPhoneNumber = (phoneNumber: string, dialCode: string) => {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits || !dialCode) {
    return digits;
  }
  return digits.startsWith(dialCode) ? digits.slice(dialCode.length) : digits;
};

export function getDisplayedPhoneNumber(phoneNumber: string, dialCode: string) {
  const trimmedPhoneNumber = phoneNumber.trim();
  if (!trimmedPhoneNumber) {
    return "";
  }

  const digitsOnly = trimmedPhoneNumber.replace(/\D/g, "");

  if (digitsOnly.startsWith(dialCode)) {
    if (!digitsOnly.slice(dialCode.length)) {
      return "";
    }
  } else if (/^\+\d{1,4}$/.test(trimmedPhoneNumber)) {
    return "";
  }

  return (
    parsePhoneNumberFromString(trimmedPhoneNumber)?.nationalNumber ??
    getLocalPhoneNumber(trimmedPhoneNumber, dialCode)
  );
}

export function getStoredPhoneNumber(phoneNumber: string, dialCode: string) {
  const localPhoneNumber = getLocalPhoneNumber(phoneNumber, dialCode);

  return localPhoneNumber ? `+${dialCode}${localPhoneNumber}` : "";
}
