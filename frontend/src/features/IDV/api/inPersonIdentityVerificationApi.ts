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
    sent_at?: string;
  };
};

type LastEmailSentResponse = {
  success: boolean;
  message: string;
  data?: {
    last_email_sent?: string | null;
  };
};

export type InPersonVerificationCodeResponse = {
  success: boolean;
  message: string;
  data: {
    verificationCode?: string;
    verificationExpiresAt?: string;
    verificationValidityDays?: number;
    sentAt?: string;
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
          sentAt: responseData.data?.sent_at,
        },
      } as InPersonVerificationCodeResponse;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Fetches the last email sent date for in-person verification.
   */
  getLastEmailSentDate: async () => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/identity-verification/in-person/last-email-sent`,
      );

      const responseData = response.data as LastEmailSentResponse;

      return {
        success: responseData.success,
        message: responseData.message,
        lastEmailSent: responseData.data?.last_email_sent,
      };
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
