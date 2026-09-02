import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useOtpExpiryCountdown } from "../useOtpExpiryCountdown";

function getIsoAtOffset(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

describe("useOtpExpiryCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
    vi.spyOn(performance, "now").mockImplementation(() => Date.now());
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("continues countdown from original issuance after remount", () => {
    const created = getIsoAtOffset(0);
    const expiry = getIsoAtOffset(10 * 60 * 1000);

    const { result, unmount } = renderHook(() =>
      useOtpExpiryCountdown(expiry, 10, created),
    );

    expect(result.current.formattedCountdown).toBe("10:00");

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.formattedCountdown).toBe("09:59");

    unmount();

    const remounted = renderHook(() =>
      useOtpExpiryCountdown(expiry, 10, created),
    );

    expect(remounted.result.current.formattedCountdown).toBe("09:59");
  });

  it("starts a fresh countdown when a new code is issued", () => {
    const created = getIsoAtOffset(0);
    const expiry = getIsoAtOffset(10 * 60 * 1000);

    const { result, rerender } = renderHook(
      ({ currentExpiry, currentCreated }) =>
        useOtpExpiryCountdown(currentExpiry, 10, currentCreated),
      {
        initialProps: {
          currentExpiry: expiry,
          currentCreated: created,
        },
      },
    );

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(result.current.formattedCountdown).toBe("09:59");

    const nextCreated = getIsoAtOffset(0);
    const nextExpiry = getIsoAtOffset(10 * 60 * 1000);

    act(() => {
      rerender({
        currentExpiry: nextExpiry,
        currentCreated: nextCreated,
      });
    });

    expect(result.current.formattedCountdown).toBe("10:00");
  });

  it("reconstructs elapsed time from created and expiry timestamps", () => {
    const created = getIsoAtOffset(-5000);
    const expiry = getIsoAtOffset(10 * 60 * 1000 - 5000);

    const { result } = renderHook(() =>
      useOtpExpiryCountdown(expiry, 10, created),
    );

    expect(result.current.formattedCountdown).toBe("09:55");
  });
});
