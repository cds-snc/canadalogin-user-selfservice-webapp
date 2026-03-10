import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useNavigateHelper } from "../useNavigate";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual =
    await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe("useNavigateHelper", () => {
  it("forwards path, replace flag, and state to react-router navigate", () => {
    const { result } = renderHook(() => useNavigateHelper());

    result.current("/target", true, { from: "profile" });

    expect(mockNavigate).toHaveBeenCalledWith("/target", {
      replace: true,
      state: { from: "profile" },
    });
  });

  it("defaults replace to false when omitted", () => {
    const { result } = renderHook(() => useNavigateHelper());

    result.current("/target");

    expect(mockNavigate).toHaveBeenCalledWith("/target", {
      replace: false,
      state: undefined,
    });
  });
});
