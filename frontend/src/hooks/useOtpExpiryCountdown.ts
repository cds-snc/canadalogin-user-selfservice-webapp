import { useEffect, useState } from "react";

type CountdownAnchor =
  | {
      mode: "absolute";
      expiryMs: number;
    }
  | {
      mode: "duration";
      durationSeconds: number;
      startedAtMs: number;
    };

const DURATION_ANCHOR_CACHE_LIMIT = 50;
const durationAnchorCache = new Map<
  string,
  { durationSeconds: number; startedAtMs: number; expiryMs: number }
>();

function parseTimestampMs(value?: string | null): number | null {
  if (!value) {
    return null;
  }

  const timestampMs = new Date(value).getTime();
  return Number.isNaN(timestampMs) ? null : timestampMs;
}

function getMonotonicNowMs(): number {
  if (
    typeof performance !== "undefined" &&
    typeof performance.now === "function"
  ) {
    return performance.now();
  }

  return Date.now();
}

function getDurationAnchorCacheKey(
  createdMs: number,
  expiryMs: number,
): string {
  return `${createdMs}:${expiryMs}`;
}

function cacheDurationAnchor(
  key: string,
  durationSeconds: number,
  expiryMs: number,
  createdMs: number,
): { durationSeconds: number; startedAtMs: number; expiryMs: number } {
  const cached = durationAnchorCache.get(key);
  if (cached && cached.durationSeconds === durationSeconds) {
    return cached;
  }

  const nowMs = Date.now();
  const nowMonotonicMs = getMonotonicNowMs();
  const observedAgeMs = nowMs - createdMs;
  const maxDurationMs = durationSeconds * 1000;
  const isObservedAgePlausible =
    observedAgeMs >= 0 && observedAgeMs <= maxDurationMs;

  // Reconstruct elapsed time when plausible so remounts without cache
  // continue from the original issuance timeline.
  const elapsedSeconds = isObservedAgePlausible
    ? Math.floor(observedAgeMs / 1000)
    : 0;

  const next = {
    durationSeconds,
    startedAtMs: nowMonotonicMs - elapsedSeconds * 1000,
    expiryMs,
  };

  durationAnchorCache.set(key, next);

  // Prefer removing expired entries before enforcing size cap.
  for (const [entryKey, entryValue] of durationAnchorCache.entries()) {
    if (entryValue.expiryMs <= nowMs) {
      durationAnchorCache.delete(entryKey);
    }
  }

  if (durationAnchorCache.size > DURATION_ANCHOR_CACHE_LIMIT) {
    const oldestKey = durationAnchorCache.keys().next().value;
    if (oldestKey) {
      durationAnchorCache.delete(oldestKey);
    }
  }

  return next;
}

function buildCountdownAnchor(
  expiry?: string | null,
  otpCreatedAt?: string | null,
): CountdownAnchor | null {
  const expiryMs = parseTimestampMs(expiry);
  if (expiryMs === null) {
    return null;
  }

  const createdMs = parseTimestampMs(otpCreatedAt);
  if (createdMs !== null && expiryMs >= createdMs) {
    const durationSeconds = Math.max(
      0,
      Math.ceil((expiryMs - createdMs) / 1000),
    );
    const cacheKey = getDurationAnchorCacheKey(createdMs, expiryMs);
    const cachedAnchor = cacheDurationAnchor(
      cacheKey,
      durationSeconds,
      expiryMs,
      createdMs,
    );

    return {
      mode: "duration",
      durationSeconds: cachedAnchor.durationSeconds,
      startedAtMs: cachedAnchor.startedAtMs,
    };
  }

  return {
    mode: "absolute",
    expiryMs,
  };
}

function getRemainingSeconds(anchor: CountdownAnchor | null): number | null {
  if (!anchor) {
    return null;
  }

  if (anchor.mode === "duration") {
    const elapsedSeconds = Math.floor(
      (getMonotonicNowMs() - anchor.startedAtMs) / 1000,
    );
    return Math.max(0, anchor.durationSeconds - elapsedSeconds);
  }

  const remainingMs = anchor.expiryMs - Date.now();
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
  otpCreatedAt?: string | null,
) {
  const [fallbackSeconds, setFallbackSeconds] = useState(
    initialFallbackSeconds,
  );
  const [resetCounter, setResetCounter] = useState(0);
  const [countdownAnchor, setCountdownAnchor] =
    useState<CountdownAnchor | null>(() =>
      buildCountdownAnchor(otpExpiry, otpCreatedAt),
    );
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(() =>
    getRemainingSeconds(buildCountdownAnchor(otpExpiry, otpCreatedAt)),
  );

  useEffect(() => {
    const nextAnchor = buildCountdownAnchor(otpExpiry, otpCreatedAt);
    setCountdownAnchor(nextAnchor);
    setRemainingSeconds(getRemainingSeconds(nextAnchor));
    setFallbackSeconds(initialFallbackSeconds);
  }, [otpExpiry, otpCreatedAt, initialFallbackSeconds, resetCounter]);

  useEffect(() => {
    if (remainingSeconds === null || remainingSeconds <= 0) {
      return;
    }

    const timer = setTimeout(() => {
      setRemainingSeconds(getRemainingSeconds(countdownAnchor));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdownAnchor, remainingSeconds]);

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
