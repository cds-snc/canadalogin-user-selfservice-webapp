import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

const HARDCODED_VERIFICATION_CODE = "387DHROGJ";

type InPersonVerificationApiResponse = {
  success: boolean;
  message: string;
  data?: {
    email_address?: string;
  };
};

export type InPersonVerificationCodeResponse = {
  success: boolean;
  message: string;
  data: {
    email_address?: string;
    verificationCode: string;
  };
};

export const inPersonIdentityVerificationApi = {
  /**
   * Sends in-person verification email and returns a temporary hardcoded verification code.
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
          ...(responseData.data ?? {}),
          verificationCode: HARDCODED_VERIFICATION_CODE,
        },
      } as InPersonVerificationCodeResponse;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },
};
