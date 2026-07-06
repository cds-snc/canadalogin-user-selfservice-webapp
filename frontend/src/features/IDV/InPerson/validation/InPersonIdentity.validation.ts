export const MAX_NAME_LENGTH = 80; // Move this to constants.ts if needed (if we wanted to use it in other places, but for now it's only used here)

export type NameValidationError = "required_or_invalid";

export type RequiredValidationError = "required";

export interface InPersonSharedSummaryErrorCodes {
  dateOfBirth?: DateOfBirthValidationError;
  address?: RequiredValidationError;
  province?: RequiredValidationError;
}

const NAME_REGEX = /^\p{L}[\p{L}\p{M}' -]*$/u;

export const isNonEmptyTrimmed = (value: string): boolean =>
  value.trim().length > 0;

export const isValidName = (value: string): boolean => {
  if (value !== value.trim()) {
    return false;
  }

  if (value.length === 0 || value.length > MAX_NAME_LENGTH) {
    return false;
  }

  return NAME_REGEX.test(value);
};

const parseIsoDate = (
  value: string,
): { year: number; month: number; day: number } | null => {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  return { year, month, day };
};

export type DateOfBirthValidationError =
  | "required"
  | "invalid"
  | "year"
  | "future";

export const getDateOfBirthValidationError = (
  value: string,
): DateOfBirthValidationError | null => {
  if (value.trim().length === 0) {
    return "required";
  }

  const parsed = parseIsoDate(value);

  if (!parsed) {
    return "invalid";
  }

  const { year, month, day } = parsed;

  if (year <= 1900) {
    return "year";
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return "invalid";
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  if (utcDate > todayUtc) {
    return "future";
  }

  return null;
};

export const isValidDateOfBirth = (value: string): boolean => {
  return getDateOfBirthValidationError(value) === null;
};
