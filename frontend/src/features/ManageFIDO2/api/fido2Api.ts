import axios from "axios";
import config from "../../../config";
import { handleApiError } from "../../../utils/apiErrorHandler";
import type { ApiErrorLike } from "../../../types/utils";

interface AssertionOptionsRequest {
  userVerification?: "required" | "preferred" | "discouraged";
}

axios.defaults.withCredentials = true;

export const fido2Api = {
  /**
   * Get user's FIDO2 credentials
   */
  getUserFIDO2Credentials: async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/v1/fido2/user`);
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Get details of a specific FIDO2 registration
   */
  getRegistrationDetails: async (registrationId: string) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/fido2/registration/${registrationId}`,
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Delete a FIDO2 registration with FIDO2 or OTP verification
   */
  deleteRegistration: async (
    registrationId: string,
    assertionResult?: unknown,
    otpPayload?: { otp: string; trxnId: string; otpVerificationType: string },
  ) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}/v1/fido2/registration`,
        {
          data: {
            id: registrationId,
            assertionResult: assertionResult,
            ...otpPayload,
          },
        },
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Update a FIDO2 registration (rename/enable/disable)
   */
  updateRegistration: async (
    registrationId: string,
    updates: Record<string, unknown>,
  ) => {
    try {
      const response = await axios.put(
        `${config.apiUrl}/v1/fido2/registration`,
        {
          id: registrationId,
          ...updates,
        },
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Get attestation options for FIDO2 registration (start registration)
   */
  getAttestationOptions: async () => {
    try {
      const requestData = {};

      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/attestation/options`,
        requestData,
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Submit attestation result (complete registration)
   */
  submitAttestationResult: async (attestationResult: unknown) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/attestation/result`,
        attestationResult,
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Get assertion options for FIDO2 authentication
   */
  getAssertionOptions: async (requestData: AssertionOptionsRequest = {}) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/assertion/options`,
        requestData,
      );
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Submit assertion result (complete authentication)
   */
  submitAssertionResult: async (
    assertionResult: unknown,
    returnJwt = false,
  ) => {
    try {
      const url = `${config.apiUrl}/v1/fido2/assertion/result${returnJwt ? "?return_jwt=true" : ""}`;
      const response = await axios.post(url, assertionResult);
      return response.data as unknown;
    } catch (error) {
      handleApiError(error as ApiErrorLike);
    }
  },

  /**
   * Look up authenticator metadata by AAGUID from the MDS service
   */
  getAuthenticatorMetadata: async (aaguid: string) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/fido2/metadata/${encodeURIComponent(aaguid)}`,
      );
      return response.data as { description?: string; is_known?: boolean };
    } catch {
      return null;
    }
  },
};
