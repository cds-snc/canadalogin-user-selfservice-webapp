import { renderHook, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { BrowserRouter } from "react-router";
import { useOtpOperations } from "../useOtpOperations";

// Mock react-router
const mockNavigate = vi.fn();
vi.mock("react-router", async () => {
  const actual = await vi.importActual("react-router");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock API modules
const mockGetUserOtpPhoneFactors = vi.fn();
vi.mock("../../features/TransientOtp/api/otpFactors", () => ({
  otpFactors: {
    getUserOtpPhoneFactors: (...args) => mockGetUserOtpPhoneFactors(...args),
  },
}));

vi.mock("../../services/authService", () => ({
  authService: {
    transientOtpSend: vi.fn(),
    transientOtpVerify: vi.fn(),
  },
}));

// Get access to the mocked functions
import { authService } from "../../services/authService";
const mockAuthService = authService;

vi.mock("../../utils/constants", () => ({
  serverMapping: {
    smsotp: "sms",
    voiceotp: "voice",
  },
}));

describe("useOtpOperations", () => {
  const defaultProps = {
    userId: "test-user-123",
    userName: "testuser@example.com",
    setErrorCode: vi.fn(),
    fallbackNavigationPath: "/fallback-path",
  };

  const wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUserOtpPhoneFactors.mockResolvedValue({
      success: true,
      data: [
        {
          id: "factor-1",
          type: "smsotp",
          destination: "+15551234567",
        },
        {
          id: "factor-2",
          type: "voiceotp",
          destination: "+15559876543",
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Initial State", () => {
    it("should initialize with correct default values", () => {
      const { result } = renderHook(() => useOtpOperations(), { wrapper });

      expect(result.current.userPhoneFactors).toEqual([]);
      expect(result.current.userSelectedMfaFactor).toBeNull();
      expect(result.current.otpSentResponse).toBeNull();
      expect(result.current.userOtpValue).toBe("");
      expect(result.current.localLoading).toBe(true);
    });

    it("should fetch user phone factors when userId is provided", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.localLoading).toBe(false);
      });

      expect(mockGetUserOtpPhoneFactors).toHaveBeenCalled();
      expect(result.current.userPhoneFactors).toHaveLength(2);
      expect(result.current.userSelectedMfaFactor).toEqual({
        id: "factor-1",
        type: "smsotp",
        destination: "+15551234567",
      });
    });

    it("should not fetch factors when userId is not provided", () => {
      renderHook(
        () =>
          useOtpOperations(
            null,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      expect(mockGetUserOtpPhoneFactors).not.toHaveBeenCalled();
    });
  });

  describe("fetchUserOtpPhoneFactors", () => {
    it("should handle successful API response with valid data", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.localLoading).toBe(false);
      });

      expect(result.current.userPhoneFactors).toEqual([
        {
          id: "factor-1",
          type: "smsotp",
          destination: "+15551234567",
        },
        {
          id: "factor-2",
          type: "voiceotp",
          destination: "+15559876543",
        },
      ]);
      expect(result.current.userSelectedMfaFactor).toEqual({
        id: "factor-1",
        type: "smsotp",
        destination: "+15551234567",
      });
    });

    it("should navigate to fallback path when no phone factors are returned", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.localLoading).toBe(false);
      });

      expect(mockNavigate).toHaveBeenCalledWith("/fallback-path");
    });

    it("should handle factors with no type field", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [
          {
            id: "factor-1",
            destination: "+15551234567",
            // No type field
          },
        ],
      });

      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      // Wait for the automatic fetch in useEffect to complete
      await waitFor(() => {
        // userPhoneFactors should be empty since the factor has no type
        // The hook filters out factors without type when creating the factors array
        expect(result.current.userPhoneFactors).toEqual([]);
        // phoneFactorsMap should also be empty since factor has no type
        expect(result.current.phoneFactorsMap).toEqual({});
      });
    });

    it("should handle API error and navigate to fallback path", async () => {
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockGetUserOtpPhoneFactors.mockRejectedValue(new Error("Network error"));

      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.localLoading).toBe(false);
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching user OTP phone factors:",
        expect.any(Error),
      );
      expect(mockNavigate).toHaveBeenCalledWith("/fallback-path");

      consoleErrorSpy.mockRestore();
    });

    it("should not navigate when fallbackNavigationPath is not provided", async () => {
      mockGetUserOtpPhoneFactors.mockResolvedValue({
        success: true,
        data: [],
      });

      renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            null,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(mockGetUserOtpPhoneFactors).toHaveBeenCalled();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe("handleChangeUserMfaSelection", () => {
    it("should select the correct factor by ID", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userPhoneFactors).toHaveLength(2);
      });

      act(() => {
        result.current.handleChangeUserMfaSelection("factor-2");
      });

      expect(result.current.userSelectedMfaFactor).toEqual({
        id: "factor-2",
        type: "voiceotp",
        destination: "+15559876543",
      });
    });

    it("should not change selection for non-existent factor ID", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userPhoneFactors).toHaveLength(2);
      });

      const originalSelection = result.current.userSelectedMfaFactor;

      act(() => {
        result.current.handleChangeUserMfaSelection("non-existent-id");
      });

      expect(result.current.userSelectedMfaFactor).toEqual(originalSelection);
    });
  });

  describe("handleSetUserOtpValue", () => {
    it("should update OTP value correctly", () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      act(() => {
        result.current.handleSetUserOtpValue("123456");
      });

      expect(result.current.userOtpValue).toBe("123456");
    });
  });

  describe("requestOtpCode", () => {
    beforeEach(() => {
      mockAuthService.transientOtpSend.mockResolvedValue({
        success: true,
        data: { trxnId: "test-transaction-id" },
      });
    });

    it("should send OTP request successfully", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      await act(async () => {
        await result.current.requestOtpCode();
      });

      expect(mockAuthService.transientOtpSend).toHaveBeenCalledWith({
        otpType: "sms",
        factor_id: "factor-1",
        user_id: "test-user-123",
      });
      expect(result.current.otpSentResponse).toEqual({
        trxnId: "test-transaction-id",
      });
      expect(defaultProps.setErrorCode).toHaveBeenCalledWith("");
    });

    it("should not send request when userSelectedMfaFactor is null", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      // Clear the selected factor
      act(() => {
        result.current.setUserSelectedMfaFactor(null);
      });

      await act(async () => {
        await result.current.requestOtpCode();
      });

      expect(mockAuthService.transientOtpSend).not.toHaveBeenCalled();
    });

    it("should not send request when userName is not provided", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            null,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      await act(async () => {
        await result.current.requestOtpCode();
      });

      expect(mockAuthService.transientOtpSend).not.toHaveBeenCalled();
    });

    it("should handle API error and set error code", async () => {
      mockAuthService.transientOtpSend.mockRejectedValue({
        data: { message: "OTP_SEND_ERROR" },
      });

      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      await act(async () => {
        await result.current.requestOtpCode();
      });

      expect(defaultProps.setErrorCode).toHaveBeenCalledWith("OTP_SEND_ERROR");
    });
  });

  describe("validateOtpCode", () => {
    const mockOnSuccess = vi.fn();

    beforeEach(() => {
      mockAuthService.transientOtpVerify.mockResolvedValue({
        success: true,
        data: { verified: true },
      });
    });

    it("should validate OTP successfully", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      // Set up OTP sent response
      act(() => {
        result.current.setOtpSentResponse({ trxnId: "test-transaction-id" });
      });

      await act(async () => {
        await result.current.validateOtpCode("123456", mockOnSuccess);
      });

      expect(mockAuthService.transientOtpVerify).toHaveBeenCalledWith({
        otp: "123456",
        trxnId: "test-transaction-id",
        otpType: "sms",
      });
      expect(defaultProps.setErrorCode).toHaveBeenCalledWith("");
      expect(mockOnSuccess).toHaveBeenCalledWith({
        success: true,
        data: { verified: true },
      });
    });

    it("should not validate when otpSentResponse is null", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      await act(async () => {
        await result.current.validateOtpCode("123456", mockOnSuccess);
      });

      expect(mockAuthService.transientOtpVerify).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should not validate when userSelectedMfaFactor is null", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      act(() => {
        result.current.setUserSelectedMfaFactor(null);
        result.current.setOtpSentResponse({ trxnId: "test-transaction-id" });
      });

      await act(async () => {
        await result.current.validateOtpCode("123456", mockOnSuccess);
      });

      expect(mockAuthService.transientOtpVerify).not.toHaveBeenCalled();
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle validation error and set error code", async () => {
      mockAuthService.transientOtpVerify.mockRejectedValue({
        response: {
          data: { message: "INVALID_OTP" },
        },
      });

      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      act(() => {
        result.current.setOtpSentResponse({ trxnId: "test-transaction-id" });
      });

      await act(async () => {
        await result.current.validateOtpCode("123456", mockOnSuccess);
      });

      expect(defaultProps.setErrorCode).toHaveBeenCalledWith("INVALID_OTP");
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should validate without calling onSuccess when onSuccess is not provided", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userSelectedMfaFactor).toBeTruthy();
      });

      act(() => {
        result.current.setOtpSentResponse({ trxnId: "test-transaction-id" });
      });

      await act(async () => {
        await result.current.validateOtpCode("123456");
      });

      expect(mockAuthService.transientOtpVerify).toHaveBeenCalled();
      expect(defaultProps.setErrorCode).toHaveBeenCalledWith("");
    });
  });

  describe("Setters", () => {
    it("should provide working setters for all state values", () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      const newPhoneFactors = [
        { id: "new-factor", type: "smsotp", destination: "+15551111111" },
      ];
      const newSelectedFactor = {
        id: "new-factor",
        type: "smsotp",
        destination: "+15551111111",
      };
      const newOtpResponse = { trxnId: "new-transaction" };

      act(() => {
        result.current.setUserPhoneFactors(newPhoneFactors);
        result.current.setUserSelectedMfaFactor(newSelectedFactor);
        result.current.setOtpSentResponse(newOtpResponse);
        result.current.setUserOtpValue("654321");
        result.current.setLocalLoading(true);
      });

      expect(result.current.userPhoneFactors).toEqual(newPhoneFactors);
      expect(result.current.userSelectedMfaFactor).toEqual(newSelectedFactor);
      expect(result.current.otpSentResponse).toEqual(newOtpResponse);
      expect(result.current.userOtpValue).toBe("654321");
      expect(result.current.localLoading).toBe(true);
    });
  });

  describe("Edge Cases", () => {
    it("should handle server mapping for different OTP types", async () => {
      const { result } = renderHook(
        () =>
          useOtpOperations(
            defaultProps.userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper },
      );

      await waitFor(() => {
        expect(result.current.userPhoneFactors).toHaveLength(2);
      });

      // Test voice OTP type mapping
      act(() => {
        result.current.handleChangeUserMfaSelection("factor-2");
      });

      await act(async () => {
        await result.current.requestOtpCode();
      });

      expect(mockAuthService.transientOtpSend).toHaveBeenCalledWith({
        otpType: "voice",
        factor_id: "factor-2",
        user_id: "test-user-123",
      });
    });

    it("should handle userId change by refetching factors", async () => {
      const { result, rerender } = renderHook(
        ({ userId }) =>
          useOtpOperations(
            userId,
            defaultProps.userName,
            defaultProps.setErrorCode,
            defaultProps.fallbackNavigationPath,
          ),
        { wrapper, initialProps: { userId: defaultProps.userId } },
      );

      await waitFor(() => {
        expect(result.current.userPhoneFactors).toHaveLength(2);
      });

      expect(mockGetUserOtpPhoneFactors).toHaveBeenCalledTimes(1);

      // Change userId
      rerender({ userId: "new-user-456" });

      await waitFor(() => {
        expect(mockGetUserOtpPhoneFactors).toHaveBeenCalledTimes(2);
      });

      expect(mockGetUserOtpPhoneFactors).toHaveBeenLastCalledWith();
    });
  });
});
