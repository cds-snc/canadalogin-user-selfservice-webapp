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
      {},
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

  it("maps and sends applicant payload for create in-person case", async () => {
    mockedAxios.post.mockResolvedValue({
      data: {
        success: true,
        message: "In-person identity verification case created",
        data: {
          verification_code_display: "AB1-2CD-34E",
          expires_at: "2026-08-12T20:58:26.760127+00:00",
        },
      },
    });

    const result =
      await inPersonIdentityVerificationApi.sendInPersonVerificationCode({
        verificationProvider: "service_canada",
        applicant: {
          firstName: "Jane",
          lastName: "Doe",
          dateOfBirth: "1990-05-15",
          address: {
            streetAddress: "123 Main St",
            region: "ON",
            postalCode: "K1A 0B1",
            country: "CA",
          },
          idType: "driverLicence",
          idExpiryDate: "2030-05-15",
        },
      });

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "http://localhost:8000/v1/identity-verification/in-person",
      {
        required_by_rp_client_id: undefined,
        verification_provider: "service_canada",
        applicant: {
          first_name: "Jane",
          last_name: "Doe",
          date_of_birth: "1990-05-15",
          address: {
            street_address: "123 Main St",
            locality: undefined,
            region: "ON",
            postal_code: "K1A 0B1",
            country: "CA",
          },
          id_type: "driverLicence",
          id_expiry_date: "2030-05-15",
        },
      },
    );

    expect(result).toEqual({
      success: true,
      message: "In-person identity verification case created",
      data: {
        verificationCode: "AB1-2CD-34E",
        verificationExpiresAt: "2026-08-12T20:58:26.760127+00:00",
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

  it("calls GET /v1/identity-verification/in-person/last-email-sent and maps lastEmailSent", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        message: "Last email sent date retrieved",
        data: {
          last_email_sent: "2026-07-10T14:30:00+00:00",
        },
      },
    });

    const result = await inPersonIdentityVerificationApi.getLastEmailSentDate();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:8000/v1/identity-verification/in-person/last-email-sent",
    );
    expect(result).toEqual({
      success: true,
      message: "Last email sent date retrieved",
      lastEmailSent: "2026-07-10T14:30:00+00:00",
    });
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("returns undefined lastEmailSent when backend response has no data object", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        message: "No in-person verification email has been sent yet",
      },
    });

    const result = await inPersonIdentityVerificationApi.getLastEmailSentDate();

    expect(result).toEqual({
      success: true,
      message: "No in-person verification email has been sent yet",
      lastEmailSent: undefined,
    });
  });

  it("calls handleApiError and returns undefined when last email request fails", async () => {
    const error = new Error("Network Error");
    mockedAxios.get.mockRejectedValue(error);

    const result = await inPersonIdentityVerificationApi.getLastEmailSentDate();

    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});
