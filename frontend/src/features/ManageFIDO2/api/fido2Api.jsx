import axios from "axios";
import config from "../../../config.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler.js";

axios.defaults.withCredentials = true;

export const fido2Api = {
  /**
   * Get user's FIDO2 credentials
   */
  getUserFIDO2Credentials: async () => {
    try {
      const response = await axios.get(`${config.apiUrl}/v1/fido2/user`);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get details of a specific FIDO2 registration
   */
  getRegistrationDetails: async (registrationId) => {
    try {
      const response = await axios.get(
        `${config.apiUrl}/v1/fido2/registration/${registrationId}`,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Delete a FIDO2 registration
   */
  deleteRegistration: async (registrationId) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}/v1/fido2/registration`,
        {
          data: { id: registrationId },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get attestation options for FIDO2 registration (start registration)
   */
  getAttestationOptions: async (options = {}) => {
    try {
      const requestBody = {
        attestation: options.attestation || "none",
        authenticatorSelection: {
          requireResidentKey: options.requireResidentKey || false,
          userVerification: options.userVerification || "preferred",
          ...(options.authenticatorAttachment && {
            authenticatorAttachment: options.authenticatorAttachment,
          }),
        },
      };

      // Add extensions if resident key is required (workaround for WebAuthn spec issue)
      if (requestBody.authenticatorSelection.requireResidentKey) {
        requestBody.extensions = { credProtect: 2 };
      }

      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/attestation/options`,
        requestBody,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Submit attestation result (complete registration)
   */
  submitAttestationResult: async (attestationResult) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/attestation/result`,
        attestationResult,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Get assertion options for FIDO2 authentication
   */
  getAssertionOptions: async () => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/assertion/options`,
        {
          userVerification: "preferred",
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Submit assertion result (complete authentication)
   */
  submitAssertionResult: async (assertionResult) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/assertion/result`,
        assertionResult,
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
