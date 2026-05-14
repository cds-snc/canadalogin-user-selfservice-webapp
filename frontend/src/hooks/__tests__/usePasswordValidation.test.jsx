import { renderHook, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { usePasswordValidation } from "../usePasswordValidation";
import { authService } from "../../services/authService";

// Mock authService
vi.mock("../../services/authService", () => ({
  authService: {
    requestPasswordPolicy: vi.fn(),
    verifyPassword: vi.fn(),
  },
}));

const mockAuthService = authService;

describe("usePasswordValidation", () => {
  const mockSetErrorCode = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses
    mockAuthService.requestPasswordPolicy.mockResolvedValue({
      success: true,
      data: {
        pwdMinLength: 12,
        pwdMaxLength: 65,
      },
    });

    mockAuthService.verifyPassword.mockResolvedValue({
      success: true,
      data: { verified: true },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("validatePassword function", () => {
    it("should validate password successfully with valid input", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should set error code for password that is too short", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("short");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should set error code for password that is too long", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      const longPassword = "a".repeat(100); // Longer than max length of 65

      await act(async () => {
        await result.current.validatePassword(longPassword);
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should set error code for empty password", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should set error code for null password", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword(null);
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should set error code for undefined password", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword(undefined);
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle password policy request failure gracefully", async () => {
      mockAuthService.requestPasswordPolicy.mockResolvedValue({
        success: false,
      });

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      // Should still attempt to verify password even if policy request fails
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      expect(mockOnSuccess).toHaveBeenCalled();
    });

    it("should handle password verification failure with error message", async () => {
      mockAuthService.verifyPassword.mockRejectedValue({
        data: { message: "CSIAM0011E" },
      });

      const { result } = renderHook(() =>
        usePasswordValidation(
          mockSetErrorCode,
          mockOnSuccess,
          false,
          mockOnError,
        ),
      );

      await act(async () => {
        await result.current.validatePassword("WrongPassword123");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "WrongPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("CSIAM0011E");
      expect(mockOnError).toHaveBeenCalledWith("CSIAM0011E");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle password verification failure without error message", async () => {
      mockAuthService.verifyPassword.mockRejectedValue(
        new Error("Network error"),
      );

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("Network error");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should work without onSuccess callback", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, null),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      // Should not throw error when onSuccess is null
    });

    it("should work without onSuccess callback when undefined", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, undefined),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockAuthService.requestPasswordPolicy).toHaveBeenCalled();
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      // Should not throw error when onSuccess is undefined
    });

    it("should handle different password policy configurations", async () => {
      mockAuthService.requestPasswordPolicy.mockResolvedValue({
        success: true,
        data: {
          pwdMinLength: 8,
          pwdMaxLength: 128,
        },
      });

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      // Test minimum length boundary
      await act(async () => {
        await result.current.validatePassword("12345678"); // Exactly 8 characters
      });

      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "12345678",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      expect(mockOnSuccess).toHaveBeenCalled();

      vi.clearAllMocks();

      // Test just below minimum length
      await act(async () => {
        await result.current.validatePassword("1234567"); // 7 characters
      });

      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
    });

    it("should handle password policy request error", async () => {
      mockAuthService.requestPasswordPolicy.mockRejectedValue({
        data: { message: "POLICY_ERROR" },
      });

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      // When policy request fails with error, it should set error code and not continue
      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("POLICY_ERROR");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should call onError for client-side password validation errors", async () => {
      const { result } = renderHook(() =>
        usePasswordValidation(
          mockSetErrorCode,
          mockOnSuccess,
          false,
          mockOnError,
        ),
      );

      await act(async () => {
        await result.current.validatePassword("short");
      });

      expect(mockAuthService.verifyPassword).not.toHaveBeenCalled();
      expect(mockSetErrorCode).toHaveBeenCalledWith("5");
      expect(mockOnError).toHaveBeenCalledWith("5");
    });
  });

  describe("Hook interface", () => {
    it("should return an object with validatePassword function", () => {
      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      expect(result.current).toHaveProperty("validatePassword");
      expect(typeof result.current.validatePassword).toBe("function");
    });

    it("should work with different setErrorCode functions", async () => {
      const alternativeSetErrorCode = vi.fn();

      const { result } = renderHook(() =>
        usePasswordValidation(alternativeSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(alternativeSetErrorCode).toHaveBeenCalledWith("");
      expect(mockSetErrorCode).not.toHaveBeenCalled();
    });

    it("should work with different onSuccess callbacks", async () => {
      const alternativeOnSuccess = vi.fn();

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, alternativeOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(alternativeOnSuccess).toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });
  });

  describe("Error scenarios", () => {
    it("should handle malformed error response", async () => {
      mockAuthService.verifyPassword.mockRejectedValue({
        // Missing data.message property
        response: { status: 401 },
      });

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockSetErrorCode).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle null error response", async () => {
      mockAuthService.verifyPassword.mockRejectedValue(null);

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      expect(mockSetErrorCode).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle password policy with missing length properties", async () => {
      mockAuthService.requestPasswordPolicy.mockResolvedValue({
        success: true,
        data: {}, // Missing pwdMinLength and pwdMaxLength
      });

      const { result } = renderHook(() =>
        usePasswordValidation(mockSetErrorCode, mockOnSuccess),
      );

      await act(async () => {
        await result.current.validatePassword("ValidPassword123");
      });

      // Should proceed with verification when policy data is incomplete
      expect(mockAuthService.verifyPassword).toHaveBeenCalledWith({
        password: "ValidPassword123",
      });
      expect(mockSetErrorCode).toHaveBeenCalledWith("");
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
