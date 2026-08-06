import {
  AsYouType,
  CountryCode,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { countryMapping } from "../../utils/constants";
import {
  COUNTRY_NAME_OVERRIDES,
  DEFAULT_COUNTRY_ISO2,
  SUPPORTED_COUNTRY_ISO2,
} from "./constants";
import type { CountryOption } from "./types";

export const getDialCodeForCountry = (countryIso2: string): string => {
  try {
    return getCountryCallingCode(countryIso2.toUpperCase() as CountryCode);
  } catch {
    return "1";
  }
};

export const getCountryFlagEmoji = (countryIso2: string): string => {
  const normalizedIso2 = countryIso2.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalizedIso2)) {
    return "";
  }

  const codePoints = [...normalizedIso2].map(
    (char) => 127397 + char.charCodeAt(0),
  );

  return String.fromCodePoint(...codePoints);
};

export const createCountryOptions = (
  language: string | undefined,
): CountryOption[] => {
  const displayLanguage = language === "fr" ? "fr" : "en";
  const nameOverrides = COUNTRY_NAME_OVERRIDES[displayLanguage];
  const localizedCountryNames =
    language === "fr"
      ? (countryMapping.frLocalization as Record<string, string>)
      : (countryMapping.localization as Record<string, string>);
  const displayNames = new Intl.DisplayNames([displayLanguage], {
    type: "region",
  });

  return SUPPORTED_COUNTRY_ISO2.map((iso2) => {
    const dialCode = getDialCodeForCountry(iso2);
    const upperIso2 = iso2.toUpperCase();
    const countryName =
      nameOverrides[iso2] ??
      localizedCountryNames[iso2] ??
      displayNames.of(upperIso2) ??
      upperIso2;
    const flagEmoji = getCountryFlagEmoji(iso2);

    return {
      iso2,
      dialCode,
      countryName,
      label: `${flagEmoji} ${countryName} +${dialCode}`.trim(),
    };
  });
};

export const getInitialCountry = (storedPhoneNumber: string): string => {
  const parsedPhoneNumber = parsePhoneNumberFromString(storedPhoneNumber);
  const parsedCountry = parsedPhoneNumber?.country?.toLowerCase();

  if (parsedCountry && SUPPORTED_COUNTRY_ISO2.includes(parsedCountry)) {
    return parsedCountry;
  }

  return DEFAULT_COUNTRY_ISO2;
};

export const getFormattedPhoneNumber = (
  formattedPhoneNumber: string,
  dialCode: string,
): string => {
  const trimmed = formattedPhoneNumber.trim();

  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("+")) {
    return trimmed;
  }

  return `+${dialCode} ${trimmed}`;
};

export const getFormattedLocalPhoneNumber = (
  localPhoneNumber: string,
  countryIso2: string,
): string => {
  const digitsOnly = localPhoneNumber.replace(/\D/g, "");
  if (!digitsOnly) {
    return "";
  }

  try {
    const formatter = new AsYouType(countryIso2.toUpperCase() as CountryCode);
    return formatter.input(digitsOnly) || digitsOnly;
  } catch {
    return digitsOnly;
  }
};

const getLocalPhoneNumber = (phoneNumber: string, dialCode: string): string => {
  const digits = phoneNumber.replace(/\D/g, "");
  if (!digits || !dialCode) {
    return digits;
  }

  return digits.startsWith(dialCode) ? digits.slice(dialCode.length) : digits;
};

export const getDisplayedPhoneNumber = (
  phoneNumber: string,
  dialCode: string,
): string => {
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
};

export const getStoredPhoneNumber = (
  phoneNumber: string,
  dialCode: string,
): string => {
  const localPhoneNumber = getLocalPhoneNumber(phoneNumber, dialCode);

  return localPhoneNumber ? `+${dialCode}${localPhoneNumber}` : "";
};

export const isPhoneNumberValidForCountry = (
  localPhoneNumber: string,
  countryIso2: string,
  dialCode: string,
): boolean => {
  const digits = localPhoneNumber.replace(/\D/g, "");
  if (!digits || !countryIso2) {
    return false;
  }

  try {
    return isValidPhoneNumber(
      `+${dialCode}${digits}`,
      countryIso2.toUpperCase() as CountryCode,
    );
  } catch {
    return false;
  }
};
