import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

type InPersonVerificationApiResponse = {
  success: boolean;
  message: string;
  data?: {
    verification_code?: string;
    verification_expires_at?: string;
    verification_validity_days?: number;
  };
};

export type InPersonVerificationCodeResponse = {
  success: boolean;
  message: string;
  data: {
    verificationCode?: string;
    verificationExpiresAt?: string;
    verificationValidityDays?: number;
  };
};

export const inPersonIdentityVerificationApi = {
  /**
   * Sends in-person verification email and returns generated verification metadata.
   */
  sendInPersonVerificationCode: async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/identity-verification/in-person`,
      );

      const responseData = response.data as InPersonVerificationApiResponse;

      return {
        ...responseData,
        data: {
          verificationCode: responseData.data?.verification_code,
          verificationExpiresAt: responseData.data?.verification_expires_at,
          verificationValidityDays:
            responseData.data?.verification_validity_days,
        },
      } as InPersonVerificationCodeResponse;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
