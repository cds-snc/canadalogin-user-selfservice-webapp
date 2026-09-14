const OTP_MAX_ATTEMPTS_ERROR_CODES = new Set([
  "otp_max_attempts",
  "otp_expired",
  "CSIAM0010E",
  "CSIAM0023E",
  "CSIAM0038E",
]);

export function isOtpMaxAttemptsErrorCode(
  errorCode: string | null | undefined,
): boolean {
  if (!errorCode) {
    return false;
  }

  return OTP_MAX_ATTEMPTS_ERROR_CODES.has(errorCode);
}

export function shouldDisplayOtpMaxAttempts({
  errorCode,
  retries,
  attempts,
}: {
  errorCode?: string | null;
  retries?: number;
  attempts?: number;
}): boolean {
  if (
    retries !== undefined &&
    retries !== null &&
    attempts !== undefined &&
    attempts !== null &&
    retries - attempts <= 0
  ) {
    return true;
  }

  return isOtpMaxAttemptsErrorCode(errorCode);
}
