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

  it("calls POST /v1/identity-verification/in-person and maps generated verification fields", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "In-person verification email sent",
        data: {
          verification_code: "ZX91AB34CD",
          verification_expires_at: "2026-08-06T00:00:00+00:00",
          verification_validity_days: 30,
          sent_at: "2026-07-10T14:30:00+00:00",
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
        verificationCode: "ZX91AB34CD",
        verificationExpiresAt: "2026-08-06T00:00:00+00:00",
        verificationValidityDays: 30,
        sentAt: "2026-07-10T14:30:00+00:00",
      },
    });
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("returns undefined verification fields when backend response has no data object", async () => {
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
        verificationCode: undefined,
        verificationExpiresAt: undefined,
        verificationValidityDays: undefined,
        sentAt: undefined,
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
