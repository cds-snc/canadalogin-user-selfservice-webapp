import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

export const identityVerificationApi = {
  /**
   * Starts the online identity verification process and returns the URL to redirect the user to bluink
   */
  getOnlineIdentityVerificationUrl: async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/identity-verification/online`,
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
