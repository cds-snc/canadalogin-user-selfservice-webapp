import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import {
  connectedServicesApi,
  type ConnectedService,
} from "../connectedServicesApi";
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

describe("connectedServicesApi.getConnectedServices", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("configures axios with withCredentials = true", () => {
    expect(mockedAxios.defaults.withCredentials).toBe(true);
  });

  it("calls GET /v1/users/connected-services and returns the services", async () => {
    const services: ConnectedService[] = [
      {
        clientId: "client-123",
        name: "Example Service",
        sessionStatus: "unknownSession",
      },
    ];
    mockedAxios.get.mockResolvedValue({ data: { services } });

    const result = await connectedServicesApi.getConnectedServices();

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "http://localhost:8000/v1/users/connected-services",
    );
    expect(result).toEqual(services);
    expect(handleApiError).not.toHaveBeenCalled();
  });

  it("calls handleApiError and returns undefined when the request fails", async () => {
    const error = new Error("Network Error");
    mockedAxios.get.mockRejectedValue(error);

    const result = await connectedServicesApi.getConnectedServices();

    expect(handleApiError).toHaveBeenCalledWith(error);
    expect(result).toBeUndefined();
  });
});
