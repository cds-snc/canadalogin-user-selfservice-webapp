import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useError } from "../useError";

vi.mock("../../utils/functions", () => ({
  getPageContent: vi.fn(() => ({
    1: "Error heading",
    7: "Fallback error",
    CSIAM001: "Mapped error message",
  })),
}));

vi.mock("../../utils/constants", () => ({
  PAGES: {
    error: "Error",
  },
}));

describe("useError", () => {
  it("maps configured error ids to page content", () => {
    const { result } = renderHook(() => useError("en"));

    act(() => {
      result.current.setError("name", "CSIAM001");
    });

    expect(result.current.getError("name")).toEqual({
      heading: "Error heading",
      errorMsg: "Mapped error message",
    });
    expect(result.current.hasErrors()).toBe(true);
  });

  it("falls back to default error content when error id is empty", () => {
    const { result } = renderHook(() => useError("en"));

    act(() => {
      result.current.setError("email", "");
    });

    expect(result.current.getError("email")).toEqual({
      heading: "Error heading",
      errorMsg: "Fallback error",
    });

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.hasErrors()).toBe(false);
  });
});
