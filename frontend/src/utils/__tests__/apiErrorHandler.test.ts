import { describe, expect, it, vi } from "vitest";

import { handleApiError, redirectToLogin } from "../apiErrorHandler";

describe("utils/apiErrorHandler", () => {
  it("redirectToLogin does not throw", () => {
    // jsdom logs a navigation-not-implemented warning when href is set.
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => redirectToLogin()).not.toThrow();

    consoleErrorSpy.mockRestore();
  });

  it("handleApiError throws error.response when present", () => {
    const apiResponse = { status: 500, data: { message: "server_error" } };
    const error = { response: apiResponse };

    try {
      handleApiError(error);
      throw new Error("Expected handleApiError to throw");
    } catch (thrown) {
      expect(thrown).toEqual(apiResponse);
    }
  });

  it("handleApiError throws original error when response is absent", () => {
    const rawError = { message: "network error" };

    try {
      handleApiError(rawError);
      throw new Error("Expected handleApiError to throw");
    } catch (thrown) {
      expect(thrown).toEqual(rawError);
    }
  });

  it("handleApiError redirects to login for 401 errors before throwing", () => {
    const apiResponse = { status: 401, data: { message: "unauthorized" } };
    const error = { response: apiResponse };
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    try {
      handleApiError(error);
      throw new Error("Expected handleApiError to throw");
    } catch (thrown) {
      expect(thrown).toEqual(apiResponse);
    }

    consoleErrorSpy.mockRestore();
  });
});
