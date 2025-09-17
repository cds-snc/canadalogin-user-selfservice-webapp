import axios from "axios";
import config from "../config";

// Helper functions for base64url encoding/decoding
const base64urlToBuffer = (base64url) => {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  const binary = atob(padded);
  const buffer = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    buffer[i] = binary.charCodeAt(i);
  }
  return buffer;
};

const bufferToBase64url = (buffer) => {
  const binary = String.fromCharCode(...new Uint8Array(buffer));
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
};

export const authService = {
  signup: async (userData) => {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/signup`,
      userData,
    );
    return response.data;
  },

  signupWithMFA: async (userData) => {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/signup/mfa`,
      userData,
    );
    return response.data;
  },

  verifyMFATOTP: async (verifyData) => {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/signup/mfa`,
      verifyData,
    );
    return response.data;
  },

  passwordSignIn: async (credentials) => {
    try {
      const response = await axios.post(
        `${config.apiUrl}/api/auth/password/signin`,
        credentials,
      );
      console.log("Password signin response:", response.data);
      return response.data;
    } catch (error) {
      console.error("Password signin error:", error.response?.data || error);
      throw error;
    }
  },

  signupWithPasskey: async (userData) => {
    try {
      // Step 1: Get registration options
      const optionsResponse = await axios.post(
        `${config.apiUrl}/api/auth/passkey/register/options`,
        userData,
      );
      const { options, state } = optionsResponse.data;

      // Step 2: Create credentials using WebAuthn API
      const publicKeyCredentialCreationOptions = {
        ...options,
        challenge: base64urlToBuffer(options.challenge),
        user: {
          ...options.user,
          id: base64urlToBuffer(options.user.id),
        },
        pubKeyCredParams: options.pubKeyCredParams,
        authenticatorSelection: options.authenticatorSelection,
        timeout: options.timeout,
        attestation: options.attestation,
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      });

      // Step 3: Prepare credential data for verification
      const credentialData = {
        id: credential.id,
        rawId: bufferToBase64url(credential.rawId),
        type: credential.type,
        response: {
          clientDataJSON: bufferToBase64url(credential.response.clientDataJSON),
          attestationObject: bufferToBase64url(
            credential.response.attestationObject,
          ),
        },
      };

      // Step 4: Verify registration
      const verificationResponse = await axios.post(
        `${config.apiUrl}/api/auth/passkey/register/verify`,
        {
          credential: credentialData,
          state: state,
        },
      );

      return verificationResponse.data;
    } catch (error) {
      console.error("Passkey registration error:", error);
      throw error;
    }
  },

  getPasskeyRegistrationOptions: async (userData) => {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/passkey/register/options`,
      userData,
    );
    return response.data;
  },

  verifyPasskeyRegistration: async (verificationData) => {
    const response = await axios.post(
      `${config.apiUrl}/api/auth/passkey/register/verify`,
      verificationData,
    );
    return response.data;
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userInfo");
  },
};
