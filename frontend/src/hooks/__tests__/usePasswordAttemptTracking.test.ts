import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { usePasswordAttemptTracking } from "../usePasswordAttemptTracking";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) => {
      if (key === "Error.password_invalid_attempts") {
        return `Incorrect password. You have ${options?.count} attempts remaining.`;
      }
      if (key === "Error.password_max_attempts") {
        return "You have reached the limit for verification attempts. Wait 15 minutes and try again.";
      }
      return key;
    },
  }),
}));

describe("usePasswordAttemptTracking", () => {
  it("shows remaining attempts for incorrect password attempts 1 through 5", () => {
    const { result, rerender } = renderHook(
      ({ errorCode }) => usePasswordAttemptTracking(errorCode),
      {
        initialProps: { errorCode: null as string | null },
      },
    );

    for (let attempt = 1; attempt <= 5; attempt += 1) {
      act(() => {
        rerender({ errorCode: "" });
      });

      act(() => {
        rerender({ errorCode: "CSIBH0044E" });
      });

      expect(result.current.invalidAttempts).toBe(attempt);
      expect(result.current.remaining).toBe(6 - attempt);
      expect(result.current.getDisplayError()).toBe(
        `Incorrect password. You have ${6 - attempt} attempts remaining.`,
      );
    }
  });

  it("shows max attempts message on the 6th incorrect password attempt", () => {
    const { result, rerender } = renderHook(
      ({ errorCode }) => usePasswordAttemptTracking(errorCode),
      {
        initialProps: { errorCode: null as string | null },
      },
    );

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      act(() => {
        rerender({ errorCode: null });
      });

      act(() => {
        rerender({ errorCode: "CSIBH0044E" });
      });

      expect(result.current.invalidAttempts).toBe(attempt);
    }

    expect(result.current.remaining).toBe(0);
    expect(result.current.isMaxAttemptsReached).toBe(true);
    expect(result.current.getDisplayError()).toBe(
      "You have reached the limit for verification attempts. Wait 15 minutes and try again.",
    );
  });

  it("supports CSIAM0010E as incorrect password code", () => {
    const { result, rerender } = renderHook(
      ({ errorCode }) => usePasswordAttemptTracking(errorCode),
      {
        initialProps: { errorCode: null as string | null },
      },
    );

    act(() => {
      rerender({ errorCode: "CSIAM0010E" });
    });

    expect(result.current.invalidAttempts).toBe(1);
    expect(result.current.remaining).toBe(5);
    expect(result.current.getDisplayError()).toBe(
      "Incorrect password. You have 5 attempts remaining.",
    );
  });

  it("returns fallback message for non-password error codes", () => {
    const { result } = renderHook(() =>
      usePasswordAttemptTracking("SOME_OTHER_ERROR"),
    );

    expect(result.current.getDisplayError("Fallback error")).toBe(
      "Fallback error",
    );
    expect(result.current.invalidAttempts).toBe(0);
  });

  it("resets attempts when resetAttempts is called", () => {
    const { result, rerender } = renderHook(
      ({ errorCode }) => usePasswordAttemptTracking(errorCode),
      {
        initialProps: { errorCode: null as string | null },
      },
    );

    act(() => {
      rerender({ errorCode: "CSIBH0044E" });
    });

    expect(result.current.invalidAttempts).toBe(1);

    act(() => {
      result.current.resetAttempts();
    });

    act(() => {
      rerender({ errorCode: null });
    });

    expect(result.current.invalidAttempts).toBe(0);
    expect(result.current.remaining).toBe(6);
    expect(result.current.isMaxAttemptsReached).toBe(false);
  });
});
