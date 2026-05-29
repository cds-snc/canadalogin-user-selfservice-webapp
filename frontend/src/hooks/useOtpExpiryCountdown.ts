import { useEffect, useState } from "react";

function getRemainingSeconds(expiry?: string | null): number | null {
  if (!expiry) {
    return null;
  }

  const expiryMs = new Date(expiry).getTime();
  if (Number.isNaN(expiryMs)) {
    return null;
  }

  const remainingMs = expiryMs - Date.now();
  return Math.max(0, Math.ceil(remainingMs / 1000));
}

function formatMinutesAndSeconds(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function useOtpExpiryCountdown(
  otpExpiry?: string | null,
  initialFallbackSeconds = 10,
) {
  const [fallbackSeconds, setFallbackSeconds] = useState(
    initialFallbackSeconds,
  );
  const [resetCounter, setResetCounter] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    getRemainingSeconds(otpExpiry),
  );

  useEffect(() => {
    setRemainingSeconds(getRemainingSeconds(otpExpiry));
    setFallbackSeconds(initialFallbackSeconds);
  }, [otpExpiry, initialFallbackSeconds, resetCounter]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setRemainingSeconds(getRemainingSeconds(otpExpiry));
    }, 1000);

    return () => clearTimeout(timer);
  }, [otpExpiry, remainingSeconds]);

  useEffect(() => {
    if (fallbackSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setFallbackSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [fallbackSeconds, remainingSeconds]);

  return {
    fallbackSeconds,
    formattedCountdown:
      remainingSeconds === null
        ? `${fallbackSeconds}`
        : formatMinutesAndSeconds(remainingSeconds),
    hasServerExpiry: remainingSeconds !== null,
    isExpired: remainingSeconds !== null && remainingSeconds <= 0,
    restartFallbackCountdown: () => {
      setResetCounter((prev) => prev + 1);
    },
  };
}
