import axios from "axios";
import config from "../../../config.jsx";
import { handleApiError } from "../../../utils/apiErrorHandler";

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
   * Delete a FIDO2 registration with FIDO2 verification
   */
  deleteRegistration: async (registrationId, assertionResult) => {
    try {
      const response = await axios.delete(
        `${config.apiUrl}/v1/fido2/registration`,
        {
          data: {
            id: registrationId,
            assertionResult: assertionResult,
          },
        },
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Update a FIDO2 registration (rename/enable/disable)
   */
  updateRegistration: async (registrationId, updates) => {
    try {
      const response = await axios.put(
        `${config.apiUrl}/v1/fido2/registration`,
        {
          id: registrationId,
          ...updates,
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
  getAttestationOptions: async () => {
    try {
      const requestData = {};

      const response = await axios.post(
        `${config.apiUrl}/v1/fido2/attestation/options`,
        requestData,
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
        {}, // Empty body - userId is retrieved from session on backend
      );
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },

  /**
   * Submit assertion result (complete authentication)
   */
  submitAssertionResult: async (assertionResult, returnJwt = false) => {
    try {
      const url = `${config.apiUrl}/v1/fido2/assertion/result${returnJwt ? "?return_jwt=true" : ""}`;
      const response = await axios.post(url, assertionResult);
      return response.data;
    } catch (error) {
      handleApiError(error);
    }
  },
};
