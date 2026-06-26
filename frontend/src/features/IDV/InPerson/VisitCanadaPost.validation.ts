export const MAX_NAME_LENGTH = 80;

const NAME_REGEX = /^\p{L}[\p{L}\p{M}' -]{0,79}$/u;

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

export const isValidDateOfBirth = (value: string): boolean => {
  const parsed = parseIsoDate(value);

  if (!parsed) {
    return false;
  }

  const { year, month, day } = parsed;

  if (year <= 1900) {
    return false;
  }

  const utcDate = new Date(Date.UTC(year, month - 1, day));

  if (
    utcDate.getUTCFullYear() !== year ||
    utcDate.getUTCMonth() !== month - 1 ||
    utcDate.getUTCDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  return utcDate <= todayUtc;
};
