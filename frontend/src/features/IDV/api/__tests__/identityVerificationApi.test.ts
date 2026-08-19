import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  identityVerificationApi,
  type IdentityVerificationClaimsResponse,
  type OnlineIdentityVerificationResponse,
} from "../identityVerificationApi";
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

describe("identityVerificationApi.getClaims", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /v1/identity-verification/claims and returns unwrapped data payload", async () => {
    const payload: IdentityVerificationClaimsResponse = {
      status: "verified",
      case_id: "case-123",
      verified_claims: {
        verification: { time: "2026-01-27T12:00:00Z" },
        claims: {
          given_name: "Ada",
          family_name: "Lovelace",
        },
      },
    };

    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        message: "Verified claims retrieved",
        data: payload,
      },
    });

    const result = await identityVerificationApi.getClaims();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:8000/v1/identity-verification/claims",
    );
    expect(result).toEqual(payload);
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("calls handleApiError and returns undefined when request fails", async () => {
    const error = new Error("Network Error");
    mockedAxios.get.mockRejectedValue(error);

    const result = await identityVerificationApi.getClaims();

    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});

describe("identityVerificationApi.postOnlineIdentityVerification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configures axios with withCredentials = true", () => {
    expect(mockedAxios.defaults.withCredentials).toBe(true);
  });

  it("calls POST /v1/identity-verification/online and returns unwrapped data payload", async () => {
    const payload: OnlineIdentityVerificationResponse = {
      case_id: "case-123",
      status: "pending",
      online_verification_url:
        "https://idv-data-store.example.com/start/case-123",
    };

    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Online identity verification case created",
        data: payload,
      },
    });

    const result =
      await identityVerificationApi.postOnlineIdentityVerification();

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/identity-verification/online",
      {},
    );
    expect(result).toEqual(payload);
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("returns undefined when backend response envelope has no data", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "Online identity verification case created",
      },
    });

    const result =
      await identityVerificationApi.postOnlineIdentityVerification();

    expect(result).toBeUndefined();
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("calls handleApiError and returns undefined when request fails", async () => {
    const error = new Error("Network Error");
    mockedAxios.post.mockRejectedValue(error);

    const result =
      await identityVerificationApi.postOnlineIdentityVerification();

    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});
