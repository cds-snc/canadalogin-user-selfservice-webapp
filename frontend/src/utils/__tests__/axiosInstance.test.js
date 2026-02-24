import { describe, it, expect } from "vitest";
import axiosInstance, {
  X_GC_CLIENT_HEADER_NAME,
  X_GC_CLIENT_HEADER_VALUE,
} from "../axiosInstance.js";

describe("axiosInstance", () => {
  it("should have withCredentials set to true", () => {
    expect(axiosInstance.defaults.withCredentials).toBe(true);
  });

  it("should have the X-GC-Client header configured", () => {
    const headers = axiosInstance.defaults.headers;
    expect(headers[X_GC_CLIENT_HEADER_NAME]).toBe(X_GC_CLIENT_HEADER_VALUE);
  });

  it("should export the correct header name constant", () => {
    expect(X_GC_CLIENT_HEADER_NAME).toBe("X-GC-Client");
  });

  it("should export the correct header value constant", () => {
    expect(X_GC_CLIENT_HEADER_VALUE).toBe(
      "canada-login-manage-profile-frontend",
    );
  });
});
