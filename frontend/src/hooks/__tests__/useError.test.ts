import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useError } from "../useError";

describe("useError", () => {
  it("maps configured error ids to page content", () => {
    const { result } = renderHook(() => useError());

    act(() => {
      result.current.setError("name", "CSIAM0011E");
    });

    expect(result.current.getError("name")).toEqual({
      heading: "There was a problem",
      errorMsg: "The verification code is invalid or has expired.",
    });
    expect(result.current.hasErrors()).toBe(true);
  });

  it("falls back to default error content when error id is empty", () => {
    const { result } = renderHook(() => useError());

    act(() => {
      result.current.setError("email", "");
    });

    expect(result.current.getError("email")).toEqual({
      heading: "There was a problem",
      errorMsg: "Server Error. Please try again later.",
    });

    act(() => {
      result.current.clearAllErrors();
    });

    expect(result.current.hasErrors()).toBe(false);
  });
});
