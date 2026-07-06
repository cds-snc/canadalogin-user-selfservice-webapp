import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";
import {
  inPersonIdentityVerificationApi,
  type InPersonVerificationCodeResponse,
} from "../inPersonIdentityVerificationApi";
import { handleApiError } from "../../../../utils/apiErrorHandler";

vi.mock("axios");

vi.mock("../../../../utils/apiErrorHandler", () => ({
  handleApiError: vi.fn(),
}));

vi.mock("../../../../config", () => ({
  default: {
    apiUrl: "http://localhost:8000",
  },
}));

const mockedAxios = vi.mocked(axios, { deep: true });

describe("inPersonIdentityVerificationApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configures axios with withCredentials = true", () => {
    expect(mockedAxios.defaults.withCredentials).toBe(true);
  });

  it("calls POST /v1/identity-verification/in-person and returns response data with hardcoded verification code", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "In-person verification email sent",
        data: {
          email_address: "user@example.com",
        },
      },
    });

    const result =
      (await inPersonIdentityVerificationApi.sendInPersonVerificationCode()) as InPersonVerificationCodeResponse;

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/identity-verification/in-person",
    );
    expect(result).toEqual({
      success: true,
      message: "In-person verification email sent",
      data: {
        email_address: "user@example.com",
        verificationCode: "387DHROGJ",
      },
    });
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("returns hardcoded verification code even when backend response has no data object", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "In-person verification email sent",
      },
    });

    const result =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode();

    expect(result).toEqual({
      success: true,
      message: "In-person verification email sent",
      data: {
        verificationCode: "387DHROGJ",
      },
    });
  });

  it("calls handleApiError and returns undefined when request fails", async () => {
    const error = new Error("Network Error");
    mockedAxios.post.mockRejectedValue(error);

    const result =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode();

    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});
