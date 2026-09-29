import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

export type ConnectedService = {
  clientId: string;
  name: string;
  sessionStatus:
    | "LAST_KNOWN_ACTIVE"
    | "LOGGED_OUT"
    | "EXPIRED"
    | "UNKNOWN"
    | "unknownSession";
  userId?: string | null;
  username?: string | null;
  applicationId?: string | null;
  applicationName?: string | null;
  protocol?: string | null;
  lastLogin?: string | null;
  lastLogout?: string | null;
  sessionId?: string | null;
  sessionExpires?: string | null;
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
