/**
 * FIDO2/WebAuthn utility functions
 * These handle the browser's WebAuthn API operations
 */

/**
 * Convert base64url string to ArrayBuffer
 */
function base64urlToArrayBuffer(base64url) {
  const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(
    base64.length + ((4 - (base64.length % 4)) % 4),
    "=",
  );
  const binary = atob(padded);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

/**
 * Convert ArrayBuffer to base64url string
 */
function arrayBufferToBase64url(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Prepare attestation options for WebAuthn API
 */
export function prepareAttestationOptions(options) {
  const prepared = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (prepared.challenge) {
    prepared.challenge = base64urlToArrayBuffer(prepared.challenge);
  }

  // Convert user.id from base64url to ArrayBuffer
  if (prepared.user && prepared.user.id) {
    prepared.user.id = base64urlToArrayBuffer(prepared.user.id);
  }

  // Convert excludeCredentials if present
  if (prepared.excludeCredentials) {
    prepared.excludeCredentials = prepared.excludeCredentials.map((cred) => ({
      ...cred,
      id: base64urlToArrayBuffer(cred.id),
    }));
  }

  return prepared;
}

/**
 * Prepare assertion options for WebAuthn API
 */
export function prepareAssertionOptions(options) {
  const prepared = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (prepared.challenge) {
    prepared.challenge = base64urlToArrayBuffer(prepared.challenge);
  }

  // Convert allowCredentials if present
  if (prepared.allowCredentials) {
    prepared.allowCredentials = prepared.allowCredentials.map((cred) => ({
      ...cred,
      id: base64urlToArrayBuffer(cred.id),
    }));
  }

  return prepared;
}

/**
 * Convert WebAuthn credential to format expected by server
 */
export function formatAttestationForServer(credential) {
  const result = {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(
        credential.response.clientDataJSON,
      ),
      attestationObject: arrayBufferToBase64url(
        credential.response.attestationObject,
      ),
    },
  };

  return result;
}

/**
 * Convert WebAuthn assertion to format expected by server
 */
export function formatAssertionForServer(credential) {
  return {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(
        credential.response.clientDataJSON,
      ),
      authenticatorData: arrayBufferToBase64url(
        credential.response.authenticatorData,
      ),
      signature: arrayBufferToBase64url(credential.response.signature),
      userHandle: credential.response.userHandle
        ? arrayBufferToBase64url(credential.response.userHandle)
        : null,
    },
  };
}

/**
 * Register a new FIDO2 credential
 */
export async function registerFIDO2Credential(
  attestationOptions,
  nickname = null,
) {
  try {
    // Prepare options for WebAuthn API
    const preparedOptions = prepareAttestationOptions(attestationOptions);

    // Create credential using WebAuthn API
    const credential = await navigator.credentials.create({
      publicKey: preparedOptions,
    });

    if (!credential) {
      throw new Error("Failed to create credential");
    }

    // Format for server
    const attestationResult = formatAttestationForServer(credential);

    // Add nickname if provided
    if (nickname) {
      attestationResult.nickname = nickname;
    }

    return attestationResult;
  } catch (error) {
    console.error("Error during FIDO2 registration:", error);
    throw error;
  }
}

/**
 * Authenticate using FIDO2 credential
 */
export async function authenticateFIDO2Credential(assertionOptions) {
  try {
    // Prepare options for WebAuthn API
    const preparedOptions = prepareAssertionOptions(assertionOptions);

    // Get credential using WebAuthn API
    const credential = await navigator.credentials.get({
      publicKey: preparedOptions,
    });

    if (!credential) {
      throw new Error("Failed to get credential");
    }

    // Format for server
    return formatAssertionForServer(credential);
  } catch (error) {
    console.error("Error during FIDO2 authentication:", error);
    throw error;
  }
}

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported() {
  return !!(
    navigator.credentials &&
    navigator.credentials.create &&
    navigator.credentials.get
  );
}
