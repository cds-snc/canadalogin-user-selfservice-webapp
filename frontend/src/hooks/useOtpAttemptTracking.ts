import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { INVALID_OTP_ERROR_CODES } from "../utils/constants";

const MAX_OTP_ATTEMPTS = 4;

export function useOtpAttemptTracking(errorCode?: string | null) {
  const { t } = useTranslation("common");
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const lastCountedError = useRef<string | null>(null);

  useEffect(() => {
    if (
      errorCode &&
      (INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorCode) &&
      errorCode !== lastCountedError.current
    ) {
      lastCountedError.current = errorCode;
      setInvalidAttempts((prev) => prev + 1);
    }
    if (!errorCode) {
      lastCountedError.current = null;
    }
  }, [errorCode]);

  // Include pending increment for current render to avoid flash
  const isNewUncountedError =
    !!errorCode &&
    (INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorCode) &&
    errorCode !== lastCountedError.current;
  const effectiveAttempts = isNewUncountedError
    ? invalidAttempts + 1
    : invalidAttempts;
  const remaining = MAX_OTP_ATTEMPTS - effectiveAttempts;

  const getDisplayError = useCallback(
    (fallbackErrorMessage?: string): string => {
      if (!errorCode && !fallbackErrorMessage) {
        return "";
      }

      if (errorCode === "CSIAM0038E") {
        return t("Error.otp_max_attempts");
      }

      if (
        errorCode &&
        (INVALID_OTP_ERROR_CODES as readonly string[]).includes(errorCode)
      ) {
        if (remaining <= 0) {
          return t("Error.otp_max_attempts");
        }
        return t("Error.otp_invalid_attempts", { count: remaining });
      }

      return fallbackErrorMessage || "";
    },
    [errorCode, remaining, t],
  );

  const resetAttempts = useCallback(() => {
    setInvalidAttempts(0);
    lastCountedError.current = null;
  }, []);

  return {
    invalidAttempts: effectiveAttempts,
    remaining,
    isMaxAttemptsReached: effectiveAttempts >= MAX_OTP_ATTEMPTS,
    getDisplayError,
    resetAttempts,
  };
}
