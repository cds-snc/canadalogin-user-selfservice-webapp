import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import axios from "../../utils/axiosInstance.js";
import { authService } from "../authService.jsx";
import { X_GC_CLIENT_HEADER_VALUE } from "../../utils/axiosInstance.js";

// Mock axios instance
vi.mock("../../utils/axiosInstance.js", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    default: {
      post: vi.fn(),
      get: vi.fn(),
      defaults: {
        withCredentials: true,
        headers: {
          "X-GC-Client": actual.X_GC_CLIENT_HEADER_VALUE,
        },
      },
    },
  };
});

// Mock config
vi.mock("../../config.jsx", () => ({
  default: {
    apiUrl: "http://localhost:8000",
  },
}));

describe("authService X-GC-Client header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should use the configured axios instance for login requests", async () => {
    const mockResponse = {
      data: { success: true, data: { id: "123", phone: "+1234", otpType: "sms" } },
    };
    axios.post.mockResolvedValue(mockResponse);

    const userData = { userName: "test@example.com", password: "password123" };
    await authService.login(userData);

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/login",
      userData,
    );
  });

  it("should use the configured axios instance for create requests", async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    const userData = { userName: "test@example.com", password: "pass", trxnId: "123" };
    await authService.create(userData);

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/users/create",
      userData,
    );
  });

  it("should use the configured axios instance for logout requests", async () => {
    const mockResponse = { data: { success: true }, status: 200 };
    axios.post.mockResolvedValue(mockResponse);

    await authService.logout();

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/logout",
    );
  });

  it("should use the configured axios instance for keepAlive requests", async () => {
    const mockResponse = { data: { success: true } };
    axios.post.mockResolvedValue(mockResponse);

    await authService.keepAlive();

    expect(axios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/auth/keep-alive",
    );
  });

  it("should use the configured axios instance for get_my_user_profile requests", async () => {
    const mockResponse = { data: { success: true } };
    axios.get.mockResolvedValue(mockResponse);

    await authService.get_my_user_profile();

    expect(axios.get).toHaveBeenCalledWith(
      "http://localhost:8000/v1/users/profile",
    );
  });

  it("should have X-GC-Client header configured on the axios instance", () => {
    expect(axios.defaults.headers["X-GC-Client"]).toBe(
      X_GC_CLIENT_HEADER_VALUE,
    );
  });
});
