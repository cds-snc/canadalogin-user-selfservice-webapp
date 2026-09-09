import { useCallback } from "react";
import { useTranslation } from "react-i18next";

export function useOtpAttemptTracking(errorCode?: string | null) {
  const { t } = useTranslation("common");
  const isMaxAttemptsReached = errorCode === "CSIAM0038E";

  const getDisplayError = useCallback(
    (fallbackErrorMessage?: string): string => {
      if (!errorCode && !fallbackErrorMessage) {
        return "";
      }

      if (isMaxAttemptsReached) {
        return t("Error.otp_max_attempts");
      }

      return fallbackErrorMessage || "";
    },
    [errorCode, isMaxAttemptsReached, t],
  );

  const resetAttempts = useCallback(() => {}, []);

  return {
    invalidAttempts: 0,
    remaining: undefined,
    isMaxAttemptsReached,
    getDisplayError,
    resetAttempts,
  };
}
