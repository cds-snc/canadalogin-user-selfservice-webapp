import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const MAX_PASSWORD_ATTEMPTS = 6;
const INVALID_PASSWORD_ERROR_CODES = ["CSIBH0044E", "CSIAM0010E"] as const;

export function usePasswordAttemptTracking(errorCode?: string | null) {
  const { t } = useTranslation("common");
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const lastCountedError = useRef<string | null>(null);

  useEffect(() => {
    if (
      errorCode &&
      (INVALID_PASSWORD_ERROR_CODES as readonly string[]).includes(errorCode) &&
      errorCode !== lastCountedError.current
    ) {
      lastCountedError.current = errorCode;
      setInvalidAttempts((prev) => prev + 1);
    }

    if (!errorCode) {
      lastCountedError.current = null;
    }
  }, [errorCode]);

  const isNewUncountedError =
    !!errorCode &&
    (INVALID_PASSWORD_ERROR_CODES as readonly string[]).includes(errorCode) &&
    errorCode !== lastCountedError.current;

  const effectiveAttempts = isNewUncountedError
    ? invalidAttempts + 1
    : invalidAttempts;

  const remaining = MAX_PASSWORD_ATTEMPTS - effectiveAttempts;

  const getDisplayError = useCallback(
    (fallbackErrorMessage?: string): string => {
      if (!errorCode && !fallbackErrorMessage) {
        return "";
      }

      if (
        errorCode &&
        (INVALID_PASSWORD_ERROR_CODES as readonly string[]).includes(errorCode)
      ) {
        if (remaining <= 0) {
          return t("Error.password_max_attempts");
        }
        return t("Error.password_invalid_attempts", { count: remaining });
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
    isMaxAttemptsReached: effectiveAttempts >= MAX_PASSWORD_ATTEMPTS,
    getDisplayError,
    resetAttempts,
  };
}
