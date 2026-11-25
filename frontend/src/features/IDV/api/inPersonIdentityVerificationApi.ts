import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

axios.defaults.withCredentials = true;

type InPersonVerificationApiResponse = {
  success: boolean;
  message: string;
  data?: {
    case_id?: string;
    status?: string;
    verification_code?: string;
    verification_code_display?: string;
    verification_expires_at?: string;
    expires_at?: string;
    verification_validity_days?: number;
    sent_at?: string;
  };
};

export type SendInPersonVerificationCodeRequest = {
  requiredByRpClientId?: string;
  verificationProvider?: "service_canada" | "canada_post";
  applicant?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
    address?: {
      streetAddress?: string;
      locality?: string;
      region?: string;
      postalCode?: string;
      country?: string;
    };
    idType?: string;
    idExpiryDate?: string;
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
   * Creates an in-person identity verification case and returns generated verification metadata.
   */
  sendInPersonVerificationCode: async (
    payload?: SendInPersonVerificationCodeRequest,
  ) => {
    try {
      const requestBody = payload
        ? {
            required_by_rp_client_id: payload.requiredByRpClientId,
            verification_provider:
              payload.verificationProvider ?? "service_canada",
            applicant: payload.applicant
              ? {
                  first_name: payload.applicant.firstName,
                  last_name: payload.applicant.lastName,
                  date_of_birth: payload.applicant.dateOfBirth,
                  address: payload.applicant.address
                    ? {
                        street_address: payload.applicant.address.streetAddress,
                        locality: payload.applicant.address.locality,
                        region: payload.applicant.address.region,
                        postal_code: payload.applicant.address.postalCode,
                        country: payload.applicant.address.country,
                      }
                    : undefined,
                  id_type: payload.applicant.idType,
                  id_expiry_date: payload.applicant.idExpiryDate,
                }
              : undefined,
          }
        : {};

      const response = await axios.post(
        `${config.apiUrl}/v1/identity-verification/in-person`,
        requestBody,
      );

      const responseData = response.data as InPersonVerificationApiResponse;

      return {
        ...responseData,
        data: {
          verificationCode:
            responseData.data?.verification_code ??
            responseData.data?.verification_code_display,
          verificationExpiresAt:
            responseData.data?.verification_expires_at ??
            responseData.data?.expires_at,
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
