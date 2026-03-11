/**
 * Unit tests for fido2Api
 *
 * Tests verify each API method:
 * - getUserFIDO2Credentials
 * - getRegistrationDetails
 * - deleteRegistration
 * - updateRegistration
 * - getAttestationOptions
 * - submitAttestationResult
 * - getAssertionOptions
 * - submitAssertionResult
 *
 * For each method the tests cover:
 * - Successful response: correct URL, HTTP verb, request body/params, return value
 * - Error handling: handleApiError is called and undefined is returned on failure
 * - Edge cases specific to the method (e.g. returnJwt flag, empty bodies)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { fido2Api } from "../fido2Api.jsx";
import { handleApiError } from "../../../../utils/apiErrorHandler";

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock("axios");

vi.mock("../../../../utils/apiErrorHandler", () => ({
  handleApiError: vi.fn(),
}));

vi.mock("../../../../config", () => ({
  default: {
    apiUrl: "http://localhost:8000",
  },
}));

// ─── Helpers ───────────────────────────────────────────────────────────────

const makeError = (status, message = "Error") => ({
  response: { status, data: { message } },
});

// ─── Tests ─────────────────────────────────────────────────────────────────

describe("fido2Api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── axios baseline ──────────────────────────────────────────────────────

  it("configures axios with withCredentials = true", () => {
    expect(axios.defaults.withCredentials).toBe(true);
  });

  // ── getUserFIDO2Credentials ─────────────────────────────────────────────

  describe("getUserFIDO2Credentials", () => {
    it("calls GET /v1/fido2/user and returns response data", async () => {
      const mockData = {
        success: true,
        data: [{ id: "cred-1", attributes: { nickname: "My Passkey" } }],
      };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getUserFIDO2Credentials();

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/user",
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("returns an empty credentials list when the user has none", async () => {
      const mockData = { success: true, data: [] };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getUserFIDO2Credentials();

      expect(result.data).toHaveLength(0);
    });

    it("returns multiple credentials", async () => {
      const mockData = {
        success: true,
        data: [
          { id: "cred-1", attributes: { nickname: "MacBook" } },
          { id: "cred-2", attributes: { nickname: "iPhone" } },
          { id: "cred-3", attributes: { nickname: "YubiKey" } },
        ],
      };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getUserFIDO2Credentials();

      expect(result.data).toHaveLength(3);
    });

    it("calls handleApiError and returns undefined on network failure", async () => {
      const error = new Error("Network Error");
      axios.get.mockRejectedValue(error);

      const result = await fido2Api.getUserFIDO2Credentials();

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on 401 unauthorised", async () => {
      const error = makeError(401, "Unauthorised");
      axios.get.mockRejectedValue(error);

      await fido2Api.getUserFIDO2Credentials();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on 500 server error", async () => {
      const error = makeError(500, "Internal Server Error");
      axios.get.mockRejectedValue(error);

      await fido2Api.getUserFIDO2Credentials();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── getRegistrationDetails ──────────────────────────────────────────────

  describe("getRegistrationDetails", () => {
    const registrationId = "reg-abc-123";

    it("calls GET /v1/fido2/registration/:id and returns response data", async () => {
      const mockData = {
        success: true,
        data: { id: registrationId, attributes: { nickname: "Work Key" } },
      };
      axios.get.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getRegistrationDetails(registrationId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8000/v1/fido2/registration/${registrationId}`,
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("interpolates the registrationId correctly into the URL", async () => {
      axios.get.mockResolvedValue({ data: {} });
      await fido2Api.getRegistrationDetails("special-id-456");

      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toBe(
        "http://localhost:8000/v1/fido2/registration/special-id-456",
      );
    });

    it("calls handleApiError and returns undefined on 404", async () => {
      const error = makeError(404, "Registration not found");
      axios.get.mockRejectedValue(error);

      const result = await fido2Api.getRegistrationDetails(registrationId);

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.get.mockRejectedValue(error);

      await fido2Api.getRegistrationDetails(registrationId);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── deleteRegistration ──────────────────────────────────────────────────

  describe("deleteRegistration", () => {
    const registrationId = "reg-del-999";
    const assertionResult = {
      id: "assertion-id",
      rawId: "raw-id",
      type: "public-key",
      response: { authenticatorData: "data", signature: "sig" },
    };

    it("calls DELETE /v1/fido2/registration with correct body and returns response data", async () => {
      const mockData = { success: true };
      axios.delete.mockResolvedValue({ data: mockData });

      const result = await fido2Api.deleteRegistration(
        registrationId,
        assertionResult,
      );

      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/registration",
        {
          data: {
            id: registrationId,
            assertionResult: assertionResult,
          },
        },
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("sends the assertion result verbatim in the request body", async () => {
      axios.delete.mockResolvedValue({ data: { success: true } });

      await fido2Api.deleteRegistration(registrationId, assertionResult);

      const sentBody = axios.delete.mock.calls[0][1].data;
      expect(sentBody.assertionResult).toEqual(assertionResult);
    });

    it("sends the registration id verbatim in the request body", async () => {
      axios.delete.mockResolvedValue({ data: { success: true } });

      await fido2Api.deleteRegistration("my-passkey-id", assertionResult);

      const sentBody = axios.delete.mock.calls[0][1].data;
      expect(sentBody.id).toBe("my-passkey-id");
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(500, "Delete failed");
      axios.delete.mockRejectedValue(error);

      const result = await fido2Api.deleteRegistration(
        registrationId,
        assertionResult,
      );

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on 401 unauthorised", async () => {
      const error = makeError(401);
      axios.delete.mockRejectedValue(error);

      await fido2Api.deleteRegistration(registrationId, assertionResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.delete.mockRejectedValue(error);

      await fido2Api.deleteRegistration(registrationId, assertionResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── updateRegistration ──────────────────────────────────────────────────

  describe("updateRegistration", () => {
    const registrationId = "reg-upd-001";

    it("calls PUT /v1/fido2/registration with id + updates spread and returns response data", async () => {
      const updates = { nickname: "Home Laptop", enabled: true };
      const mockData = { success: true };
      axios.put.mockResolvedValue({ data: mockData });

      const result = await fido2Api.updateRegistration(registrationId, updates);

      expect(axios.put).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/registration",
        {
          id: registrationId,
          ...updates,
        },
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("renames a passkey (nickname update only)", async () => {
      const mockData = { success: true, message: "Renamed" };
      axios.put.mockResolvedValue({ data: mockData });

      const result = await fido2Api.updateRegistration(registrationId, {
        nickname: "New Name",
      });

      const sentBody = axios.put.mock.calls[0][1];
      expect(sentBody).toEqual({ id: registrationId, nickname: "New Name" });
      expect(result).toEqual(mockData);
    });

    it("disables a passkey (enabled: false)", async () => {
      axios.put.mockResolvedValue({ data: { success: true } });

      await fido2Api.updateRegistration(registrationId, { enabled: false });

      const sentBody = axios.put.mock.calls[0][1];
      expect(sentBody).toEqual({ id: registrationId, enabled: false });
    });

    it("supports multiple fields in a single update", async () => {
      const updates = { nickname: "Work Key", enabled: true, tag: "work" };
      axios.put.mockResolvedValue({ data: { success: true } });

      await fido2Api.updateRegistration(registrationId, updates);

      const sentBody = axios.put.mock.calls[0][1];
      expect(sentBody).toEqual({ id: registrationId, ...updates });
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(404, "Registration not found");
      axios.put.mockRejectedValue(error);

      const result = await fido2Api.updateRegistration(registrationId, {
        nickname: "x",
      });

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.put.mockRejectedValue(error);

      await fido2Api.updateRegistration(registrationId, { nickname: "x" });

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── getAttestationOptions ───────────────────────────────────────────────

  describe("getAttestationOptions", () => {
    it("calls POST /v1/fido2/attestation/options with empty body and returns response data", async () => {
      const mockData = {
        success: true,
        data: {
          challenge: "attestation-challenge",
          rp: { name: "GC Sign-In" },
        },
      };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getAttestationOptions();

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/attestation/options",
        {},
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("sends an empty object as the request body", async () => {
      axios.post.mockResolvedValue({ data: {} });

      await fido2Api.getAttestationOptions();

      expect(axios.post.mock.calls[0][1]).toEqual({});
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(500, "Server error");
      axios.post.mockRejectedValue(error);

      const result = await fido2Api.getAttestationOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on 401 unauthorised", async () => {
      const error = makeError(401);
      axios.post.mockRejectedValue(error);

      await fido2Api.getAttestationOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.post.mockRejectedValue(error);

      await fido2Api.getAttestationOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── submitAttestationResult ─────────────────────────────────────────────

  describe("submitAttestationResult", () => {
    const attestationResult = {
      id: "att-id",
      rawId: "att-raw-id",
      type: "public-key",
      response: { attestationObject: "obj", clientDataJSON: "json" },
    };

    it("calls POST /v1/fido2/attestation/result with the attestation result and returns response data", async () => {
      const mockData = { success: true, message: "Registration complete" };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.submitAttestationResult(attestationResult);

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/attestation/result",
        attestationResult,
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("sends the attestation result verbatim as the request body", async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      await fido2Api.submitAttestationResult(attestationResult);

      expect(axios.post.mock.calls[0][1]).toEqual(attestationResult);
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(400, "Invalid attestation");
      axios.post.mockRejectedValue(error);

      const result = await fido2Api.submitAttestationResult(attestationResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.post.mockRejectedValue(error);

      await fido2Api.submitAttestationResult(attestationResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── getAssertionOptions ─────────────────────────────────────────────────

  describe("getAssertionOptions", () => {
    it("calls POST /v1/fido2/assertion/options with empty body and returns response data", async () => {
      const mockData = {
        success: true,
        data: {
          challenge: "assertion-challenge",
          allowCredentials: [{ id: "cred-1", type: "public-key" }],
        },
      };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getAssertionOptions();

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/assertion/options",
        {},
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("sends an empty object as the request body (userId from session)", async () => {
      axios.post.mockResolvedValue({ data: {} });

      await fido2Api.getAssertionOptions();

      expect(axios.post.mock.calls[0][1]).toEqual({});
    });

    it("returns allowCredentials array from response", async () => {
      const mockData = {
        success: true,
        data: {
          challenge: "ch",
          allowCredentials: [
            { id: "c1", type: "public-key" },
            { id: "c2", type: "public-key" },
          ],
        },
      };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.getAssertionOptions();

      expect(result.data.allowCredentials).toHaveLength(2);
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(500, "Server error");
      axios.post.mockRejectedValue(error);

      const result = await fido2Api.getAssertionOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on 401 unauthorised", async () => {
      const error = makeError(401);
      axios.post.mockRejectedValue(error);

      await fido2Api.getAssertionOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.post.mockRejectedValue(error);

      await fido2Api.getAssertionOptions();

      expect(handleApiError).toHaveBeenCalledWith(error);
    });
  });

  // ── submitAssertionResult ───────────────────────────────────────────────

  describe("submitAssertionResult", () => {
    const assertionResult = {
      id: "assertion-id",
      rawId: "raw-id",
      type: "public-key",
      response: { authenticatorData: "auth-data", signature: "sig" },
    };

    it("calls POST /v1/fido2/assertion/result without query param by default and returns response data", async () => {
      const mockData = { success: true, message: "Authentication successful" };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.submitAssertionResult(assertionResult);

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/assertion/result",
        assertionResult,
      );
      expect(result).toEqual(mockData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("appends ?return_jwt=true to the URL when returnJwt is true", async () => {
      axios.post.mockResolvedValue({ data: { success: true, jwt: "token" } });

      await fido2Api.submitAssertionResult(assertionResult, true);

      expect(axios.post).toHaveBeenCalledWith(
        "http://localhost:8000/v1/fido2/assertion/result?return_jwt=true",
        assertionResult,
      );
    });

    it("does not append query param when returnJwt is false (explicit)", async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      await fido2Api.submitAssertionResult(assertionResult, false);

      const calledUrl = axios.post.mock.calls[0][0];
      expect(calledUrl).toBe("http://localhost:8000/v1/fido2/assertion/result");
      expect(calledUrl).not.toContain("return_jwt");
    });

    it("does not append query param when returnJwt is omitted (defaults to false)", async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      await fido2Api.submitAssertionResult(assertionResult);

      const calledUrl = axios.post.mock.calls[0][0];
      expect(calledUrl).not.toContain("return_jwt");
    });

    it("sends the assertion result verbatim as the request body", async () => {
      axios.post.mockResolvedValue({ data: { success: true } });

      await fido2Api.submitAssertionResult(assertionResult);

      expect(axios.post.mock.calls[0][1]).toEqual(assertionResult);
    });

    it("returns the JWT token when returnJwt is true", async () => {
      const mockData = {
        success: true,
        jwt: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
      };
      axios.post.mockResolvedValue({ data: mockData });

      const result = await fido2Api.submitAssertionResult(
        assertionResult,
        true,
      );

      expect(result).toEqual(mockData);
      expect(result).toHaveProperty("jwt");
    });

    it("calls handleApiError and returns undefined on failure", async () => {
      const error = makeError(400, "Invalid assertion");
      axios.post.mockRejectedValue(error);

      const result = await fido2Api.submitAssertionResult(assertionResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError on 401 unauthorised", async () => {
      const error = makeError(401);
      axios.post.mockRejectedValue(error);

      await fido2Api.submitAssertionResult(assertionResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on network error", async () => {
      const error = new Error("Network Error");
      axios.post.mockRejectedValue(error);

      await fido2Api.submitAssertionResult(assertionResult);

      expect(handleApiError).toHaveBeenCalledWith(error);
    });

    it("calls handleApiError on network error even when returnJwt is true", async () => {
      const error = new Error("Network Error");
      axios.post.mockRejectedValue(error);

      const result = await fido2Api.submitAssertionResult(
        assertionResult,
        true,
      );

      expect(handleApiError).toHaveBeenCalledWith(error);
      expect(result).toBeUndefined();
    });
  });
});
