import { describe, it, expect } from "vitest";
import { OIDC_REDIRECT } from "../constants.jsx";
import { X_GC_CLIENT_HEADER_VALUE } from "../axiosInstance.js";

describe("OIDC_REDIRECT", () => {
  it("should include x-gc-client query parameter in login URL", () => {
    expect(OIDC_REDIRECT.login).toContain(
      `x-gc-client=${X_GC_CLIENT_HEADER_VALUE}`,
    );
  });

  it("should include x-gc-client query parameter in reauth URL", () => {
    expect(OIDC_REDIRECT.reauth).toContain(
      `x-gc-client=${X_GC_CLIENT_HEADER_VALUE}`,
    );
  });

  it("should have correctly formed login URL with query parameter", () => {
    const url = new URL(OIDC_REDIRECT.login);
    expect(url.searchParams.get("x-gc-client")).toBe(X_GC_CLIENT_HEADER_VALUE);
    expect(url.pathname).toBe("/v1/auth/login");
  });

  it("should have correctly formed reauth URL with query parameter", () => {
    const url = new URL(OIDC_REDIRECT.reauth);
    expect(url.searchParams.get("x-gc-client")).toBe(X_GC_CLIENT_HEADER_VALUE);
    expect(url.pathname).toBe("/v1/auth/reauth");
  });
});
