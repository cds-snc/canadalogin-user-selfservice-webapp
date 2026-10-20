import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import { identityDocumentsApi } from "../identityDocumentsApi";
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

const PASSPORT_DOCUMENT = {
  key: "PASSPORT",
  name_en: "Passport",
  name_fr: "Passeport",
  options: [
    {
      id: 1,
      name_en: "Canada",
      name_fr: "Canada",
      option_type: "country",
      canada_post_id: "C014",
      country_code: "CA",
      province_code: null,
      requires_proof: true,
    },
  ],
};

describe("identityDocumentsApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls GET /v1/identity-verification/identity-documents and returns the documents", async () => {
    mockedAxios.get.mockResolvedValue({
      data: {
        success: true,
        message: "Identity documents retrieved",
        data: [PASSPORT_DOCUMENT],
      },
    });

    const result = await identityDocumentsApi.getIdentityDocuments();

    const [url, requestConfig] = mockedAxios.get.mock.calls[0];
    expect(url).toBe(
      "http://localhost:8000/v1/identity-verification/identity-documents",
    );
    expect((requestConfig?.params as URLSearchParams).toString()).toBe("");
    expect(result).toEqual([PASSPORT_DOCUMENT]);
  });

  it("forwards document type filters as repeated query params", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, message: "ok", data: [] },
    });

    await identityDocumentsApi.getIdentityDocuments([
      "PASSPORT",
      "DRIVERS_LICENCE",
    ]);

    const [, requestConfig] = mockedAxios.get.mock.calls[0];
    expect((requestConfig?.params as URLSearchParams).toString()).toBe(
      "types=PASSPORT&types=DRIVERS_LICENCE",
    );
  });

  it("returns an empty list when the response has no data", async () => {
    mockedAxios.get.mockResolvedValue({
      data: { success: true, message: "ok", data: null },
    });

    await expect(identityDocumentsApi.getIdentityDocuments()).resolves.toEqual(
      [],
    );
  });

  it("delegates errors to handleApiError", async () => {
    const error = { response: { status: 503 } };
    mockedAxios.get.mockRejectedValue(error);

    await identityDocumentsApi.getIdentityDocuments();

    expect(handleApiError).toHaveBeenCalledWith(error);
  });
});
