import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "axios";
import { otpFactors } from "../otpFactors.jsx";
import { handleApiError } from "../../../../utils/apiErrorHandler.js";

// Mock axios
vi.mock("axios");

// Mock handleApiError
vi.mock("../../../../utils/apiErrorHandler.js", () => ({
  handleApiError: vi.fn(),
}));

// Mock config
vi.mock("../../../../config.jsx", () => ({
  default: {
    apiUrl: "http://localhost:8000",
  },
}));

describe("otpFactors API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUserOtpPhoneFactors", () => {
    it("successfully fetches user OTP phone factors", async () => {
      const mockUserId = "test-user-123";
      const mockResponseData = {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            status: "active",
          },
          {
            id: "factor-2",
            type: "voiceotp",
            phoneNumber: "+15559876543",
            status: "active",
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        `http://localhost:8000/v1/users/${mockUserId}/otp_factors`,
      );
      expect(result).toEqual(mockResponseData);
      expect(handleApiError).not.toHaveBeenCalled();
    });

    it("returns data with single OTP factor", async () => {
      const mockUserId = "user-456";
      const mockResponseData = {
        success: true,
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            status: "active",
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8000/v1/users/user-456/otp_factors",
      );
      expect(result).toEqual(mockResponseData);
      expect(result.data).toHaveLength(1);
    });

    it("returns data with no OTP factors (empty array)", async () => {
      const mockUserId = "user-789";
      const mockResponseData = {
        success: true,
        data: [],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8000/v1/users/user-789/otp_factors",
      );
      expect(result).toEqual(mockResponseData);
      expect(result.data).toHaveLength(0);
    });

    it("returns data with multiple factor types (SMS and Voice)", async () => {
      const mockUserId = "user-multi";
      const mockResponseData = {
        success: true,
        data: [
          {
            id: "sms-factor",
            type: "smsotp",
            phoneNumber: "+15551111111",
            status: "active",
          },
          {
            id: "voice-factor",
            type: "voiceotp",
            phoneNumber: "+15552222222",
            status: "active",
          },
          {
            id: "another-sms",
            type: "smsotp",
            phoneNumber: "+15553333333",
            status: "pending",
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(result.data).toHaveLength(3);
      expect(result.data[0].type).toBe("smsotp");
      expect(result.data[1].type).toBe("voiceotp");
    });

    it("calls handleApiError when request fails with network error", async () => {
      const mockUserId = "user-error";
      const networkError = new Error("Network Error");

      axios.get.mockRejectedValue(networkError);

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8000/v1/users/user-error/otp_factors",
      );
      expect(handleApiError).toHaveBeenCalledWith(networkError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 404 error", async () => {
      const mockUserId = "nonexistent-user";
      const notFoundError = {
        response: {
          status: 404,
          data: { message: "User not found" },
        },
      };

      axios.get.mockRejectedValue(notFoundError);

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(handleApiError).toHaveBeenCalledWith(notFoundError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 401 unauthorized", async () => {
      const mockUserId = "unauthorized-user";
      const unauthorizedError = {
        response: {
          status: 401,
          data: { detail: "Invalid or expired token" },
        },
      };

      axios.get.mockRejectedValue(unauthorizedError);

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(handleApiError).toHaveBeenCalledWith(unauthorizedError);
      expect(result).toBeUndefined();
    });

    it("calls handleApiError when request fails with 500 server error", async () => {
      const mockUserId = "server-error-user";
      const serverError = {
        response: {
          status: 500,
          data: { message: "Internal server error" },
        },
      };

      axios.get.mockRejectedValue(serverError);

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(handleApiError).toHaveBeenCalledWith(serverError);
      expect(result).toBeUndefined();
    });

    it("uses correct endpoint URL format", async () => {
      const mockUserId = "format-test-user";
      const mockResponseData = {
        success: true,
        data: [],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      await otpFactors.getUserOtpPhoneFactors(mockUserId);

      const calledUrl = axios.get.mock.calls[0][0];
      expect(calledUrl).toBe(
        "http://localhost:8000/v1/users/format-test-user/otp_factors",
      );
      expect(calledUrl).toContain("/v1/users/");
      expect(calledUrl).toContain("/otp_factors");
    });

    it("handles user ID with special characters", async () => {
      const mockUserId = "user-with-dashes-123";
      const mockResponseData = {
        success: true,
        data: [],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(axios.get).toHaveBeenCalledWith(
        "http://localhost:8000/v1/users/user-with-dashes-123/otp_factors",
      );
    });

    it("preserves response data structure", async () => {
      const mockUserId = "structure-test";
      const mockResponseData = {
        success: true,
        message: "Factors retrieved successfully",
        data: [
          {
            id: "factor-1",
            type: "smsotp",
            phoneNumber: "+15551234567",
            status: "active",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-15T12:30:00Z",
            metadata: {
              verified: true,
              lastUsed: "2025-01-20T10:00:00Z",
            },
          },
        ],
      };

      axios.get.mockResolvedValue({
        data: mockResponseData,
      });

      const result = await otpFactors.getUserOtpPhoneFactors(mockUserId);

      expect(result).toEqual(mockResponseData);
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(result).toHaveProperty("data");
      expect(result.data[0]).toHaveProperty("metadata");
    });

    it("axios is configured with withCredentials", () => {
      expect(axios.defaults.withCredentials).toBe(true);
    });
  });
});
