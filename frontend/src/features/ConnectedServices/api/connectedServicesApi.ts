import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

export type ConnectedService = {
  clientId: string;
  name: string;
  url?: string | null;
  localizedUrls?: Record<string, string> | null;
  lastLogin?: string | null;
  lastLogout?: string | null;
};

type ConnectedServicesResponse = {
  services: ConnectedService[];
};

axios.defaults.withCredentials = true;

export const connectedServicesApi = {
  getConnectedServices: async (): Promise<ConnectedService[]> => {
    try {
      const response = await axios.get<ConnectedServicesResponse>(
        `${config.apiUrl}/v1/users/connected-services`,
      );
      return response.data.services;
    } catch (error) {
      return handleApiError(error as ApiErrorLike);
    }
  },
};
