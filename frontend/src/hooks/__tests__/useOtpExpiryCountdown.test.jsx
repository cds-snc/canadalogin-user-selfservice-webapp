import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useOtpExpiryCountdown } from "../useOtpExpiryCountdown";

describe("useOtpExpiryCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("does not immediately expire when client clock is far ahead if created+expiry are provided", () => {
    vi.useFakeTimers();

    // Simulate a badly skewed client clock set far into the future.
    vi.setSystemTime(new Date("2099-01-01T00:00:00.000Z"));

    const otpCreatedAt = "2026-01-01T10:00:00.000Z";
    const otpExpiry = "2026-01-01T10:10:00.000Z";

    const { result } = renderHook(() =>
      useOtpExpiryCountdown(otpExpiry, 10, otpCreatedAt),
    );

    expect(result.current.hasServerExpiry).toBe(true);
    expect(result.current.isExpired).toBe(false);
    expect(result.current.formattedCountdown).toBe("10:00");
  });

  it("expires immediately in fallback absolute-time mode when created timestamp is missing and client clock is far ahead", () => {
    vi.useFakeTimers();

    // With no created timestamp available, fallback logic compares expiry
    // against Date.now, so severe client clock skew can cause immediate expiry.
    vi.setSystemTime(new Date("2099-01-01T00:00:00.000Z"));

    const otpExpiry = "2026-01-01T10:10:00.000Z";

    const { result } = renderHook(() => useOtpExpiryCountdown(otpExpiry, 10));

    expect(result.current.hasServerExpiry).toBe(true);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.formattedCountdown).toBe("00:00");
  });
});
