import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import { deleteMFAPhoneNumberApi } from "../DeleteMFAPhoneNumberAPI";
import { handleApiError } from "../../../../../utils/apiErrorHandler";

// Mock axios
vi.mock("axios");

// Mock handleApiError
vi.mock("../../../../../utils/apiErrorHandler.js", () => ({
  handleApiError: vi.fn(),
}));

// Mock config
vi.mock("../../../../../config.ts", () => ({
  default: {
    apiUrl: "http://localhost:8000",
  },
}));

describe("deleteMFAPhoneNumberApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deleteMFA", () => {
    const mockFactorId = "factor-123";
    const mockOtpType = "sms";
    const mockDeleteParams = {
      id: mockFactorId,
      otpType: mockOtpType,
    };

    it("successfully deletes an MFA phone number", async () => {
      const mockResponseData = {
        success: true,
        message: "MFA phone number deleted successfully",
      };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8000/v1/otp/mfa/delete",
        {
          data: {
            id: mockFactorId,
            otpType: mockOtpType,
          },
        },
      );
      expect(result).toEqual(mockResponseData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("successfully deletes an SMS MFA factor", async () => {
      const mockResponseData = {
        success: true,
        factorId: "sms-factor-456",
      };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA({
        id: "sms-factor-456",
        otpType: "sms",
      });

      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8000/v1/otp/mfa/delete",
        {
          data: {
            id: "sms-factor-456",
            otpType: "sms",
          },
        },
      );
      expect(result).toEqual(mockResponseData);
    });

    it("successfully deletes a Voice MFA factor", async () => {
      const mockResponseData = {
        success: true,
        factorId: "voice-factor-789",
      };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA({
        id: "voice-factor-789",
        otpType: "voice",
      });

      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8000/v1/otp/mfa/delete",
        {
          data: {
            id: "voice-factor-789",
            otpType: "voice",
          },
        },
      );
      expect(result).toEqual(mockResponseData);
    });

    it("returns response data with additional metadata", async () => {
      const mockResponseData = {
        success: true,
        message: "MFA deleted",
        timestamp: "2025-10-20T12:00:00Z",
        remainingFactors: 1,
      };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(result).toEqual(mockResponseData);
      expect(result.timestamp).toBe("2025-10-20T12:00:00Z");
      expect(result.remainingFactors).toBe(1);
    });

    it("calls handleApiError when request fails with network error", async () => {
      const networkError = new Error("Network Error");
      axios.delete.mockRejectedValue(networkError);

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(handleApiError).toHaveBeenCalledWith(networkError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 404 error", async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: {
            message: "MFA factor not found",
          },
        },
      };

      axios.delete.mockRejectedValue(notFoundError);

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(handleApiError).toHaveBeenCalledWith(notFoundError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 401 unauthorized", async () => {
      const unauthorizedError = {
        response: {
          status: 401,
          data: {
            message: "Unauthorized - Session expired",
          },
        },
      };

      axios.delete.mockRejectedValue(unauthorizedError);

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(handleApiError).toHaveBeenCalledWith(unauthorizedError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 403 forbidden", async () => {
      const forbiddenError = {
        response: {
          status: 403,
          data: {
            message: "Cannot delete last MFA factor",
          },
        },
      };

      axios.delete.mockRejectedValue(forbiddenError);

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(handleApiError).toHaveBeenCalledWith(forbiddenError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 500 server error", async () => {
      const serverError = {
        response: {
          status: 500,
          data: {
            message: "Internal server error",
          },
        },
      };

      axios.delete.mockRejectedValue(serverError);

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(handleApiError).toHaveBeenCalledWith(serverError);
      expect(result).toBeUndefined();
    });

    it("uses correct endpoint URL format", async () => {
      const mockResponseData = { success: true };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(axios.delete).toHaveBeenCalledWith(
        "http://localhost:8000/v1/otp/mfa/delete",
        expect.any(Object),
      );
    });

    it("sends data in request body with correct structure", async () => {
      const mockResponseData = { success: true };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      await deleteMFAPhoneNumberApi.deleteMFA({
        id: "test-id-123",
        otpType: "sms",
      });

      expect(axios.delete).toHaveBeenCalledWith(expect.any(String), {
        data: {
          id: "test-id-123",
          otpType: "sms",
        },
      });
    });

    it("handles factor ID with special characters", async () => {
      const mockResponseData = { success: true };
      const specialFactorId = "factor-abc-123-!@#";

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      await deleteMFAPhoneNumberApi.deleteMFA({
        id: specialFactorId,
        otpType: "voice",
      });

      expect(axios.delete).toHaveBeenCalledWith(expect.any(String), {
        data: {
          id: specialFactorId,
          otpType: "voice",
        },
      });
    });

    it("preserves response data structure", async () => {
      const complexResponseData = {
        success: true,
        data: {
          deletedFactor: {
            id: mockFactorId,
            type: mockOtpType,
            phoneNumber: "+1234567890",
          },
          remainingFactors: [
            {
              id: "factor-999",
              type: "voice",
            },
          ],
        },
        metadata: {
          timestamp: "2025-10-20T12:00:00Z",
        },
      };

      axios.delete.mockResolvedValue({
        data: complexResponseData,
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(result).toEqual(complexResponseData);
      expect(result.data.deletedFactor.id).toBe(mockFactorId);
      expect(result.data.remainingFactors).toHaveLength(1);
    });

    it("axios is configured with withCredentials", () => {
      expect(axios.defaults.withCredentials).toBe(true);
    });

    it("handles empty response data", async () => {
      axios.delete.mockResolvedValue({
        data: {},
      });

      const result = await deleteMFAPhoneNumberApi.deleteMFA(mockDeleteParams);

      expect(result).toEqual({});
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("handles null id parameter", async () => {
      const mockResponseData = { success: true };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      await deleteMFAPhoneNumberApi.deleteMFA({
        id: null,
        otpType: "sms",
      });

      expect(axios.delete).toHaveBeenCalledWith(expect.any(String), {
        data: {
          id: null,
          otpType: "sms",
        },
      });
    });

    it("handles undefined otpType parameter", async () => {
      const mockResponseData = { success: true };

      axios.delete.mockResolvedValue({
        data: mockResponseData,
      });

      await deleteMFAPhoneNumberApi.deleteMFA({
        id: "test-id",
        otpType: undefined,
      });

      expect(axios.delete).toHaveBeenCalledWith(expect.any(String), {
        data: {
          id: "test-id",
          otpType: undefined,
        },
      });
    });
  });
});
