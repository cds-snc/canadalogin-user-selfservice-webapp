import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";
import type {
  AuthServiceResponse,
  LogoutResponseData,
} from "../../../types/services";
import type { OnlineIdentityVerificationMockResponse } from "../../../types/user";

export type OnlineIdentityVerificationResponse = {
  case_id: string;
  status: "pending" | "in_progress" | "verified" | "failed" | "cancelled";
  verification_code_display?: string | null;
  online_verification_url?: string | null;
  expires_at?: string | null;
};

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
  storeTargetUrl: async (targetUrl: string) => {
    try {
      const response = await axios.post<AuthServiceResponse>(
        `${config.apiUrl}/v1/identity-verification/target-url`,
        { target_url: targetUrl },
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
  getPostIdvRedirectUrl: async () => {
    try {
      const response = await axios.get<AuthServiceResponse<LogoutResponseData>>(
        `${config.apiUrl}/v1/identity-verification/target-url`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  getOnlineIdentityVerificationMockResponse: async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/identity-verification/online/mock-success-response`,
      );
      return response.data as OnlineIdentityVerificationMockResponse;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
  postOnlineIdentityVerification: async () => {
    try {
      const response = await axios.post<OnlineIdentityVerificationResponse>(
        `${config.apiUrl}/v1/identity-verification/online`,
        {},
      );
      return response.data;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
