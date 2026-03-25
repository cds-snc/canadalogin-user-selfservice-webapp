/**
 * FIDO2/WebAuthn utility functions
 * These handle the browser's WebAuthn API operations
 */

/**
 * Convert base64url string to ArrayBuffer
 */
function base64urlToArrayBuffer(base64url: string): ArrayBuffer {
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
function arrayBufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

interface ServerAttestationOptions {
  challenge?: string;
  user?: { id?: string | ArrayBuffer; [key: string]: unknown };
  excludeCredentials?: Array<{ id: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

interface ServerAssertionOptions {
  challenge?: string;
  allowCredentials?: Array<{ id: string; [key: string]: unknown }>;
  [key: string]: unknown;
}

/**
 * Prepare attestation options for WebAuthn API
 */
export function prepareAttestationOptions(
  options: ServerAttestationOptions,
): Record<string, unknown> {
  const prepared: ServerAttestationOptions = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (prepared.challenge) {
    (prepared as Record<string, unknown>).challenge = base64urlToArrayBuffer(
      prepared.challenge,
    );
  }

  // Convert user.id from base64url to ArrayBuffer
  if (prepared.user && prepared.user.id) {
    const userId = prepared.user.id;
    prepared.user = {
      ...prepared.user,
      id: typeof userId === "string" ? base64urlToArrayBuffer(userId) : userId,
    };
  }

  // Convert excludeCredentials if present
  if (prepared.excludeCredentials) {
    (prepared as Record<string, unknown>).excludeCredentials =
      prepared.excludeCredentials.map((cred) => ({
        ...cred,
        id: base64urlToArrayBuffer(cred.id),
      }));
  }

  return prepared as Record<string, unknown>;
}

/**
 * Prepare assertion options for WebAuthn API
 */
export function prepareAssertionOptions(
  options: ServerAssertionOptions,
): Record<string, unknown> {
  const prepared: ServerAssertionOptions = { ...options };

  // Convert challenge from base64url to ArrayBuffer
  if (prepared.challenge) {
    (prepared as Record<string, unknown>).challenge = base64urlToArrayBuffer(
      prepared.challenge,
    );
  }

  // Convert allowCredentials if present
  if (prepared.allowCredentials) {
    (prepared as Record<string, unknown>).allowCredentials =
      prepared.allowCredentials.map((cred) => ({
        ...cred,
        id: base64urlToArrayBuffer(cred.id),
      }));
  }

  return prepared as Record<string, unknown>;
}

interface AttestationResult {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    attestationObject: string;
  };
  getTransports?: unknown;
  nickname?: string;
  aaguid?: string;
}

/**
 * Extract AAGUID from authenticator data.
 * Authenticator data layout: rpIdHash (32) + flags (1) + signCount (4) + AAGUID (16) + ...
 */
function extractAaguid(authenticatorData: ArrayBuffer): string {
  const bytes = new Uint8Array(authenticatorData, 37, 16);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

interface AssertionResult {
  id: string;
  rawId: string;
  type: string;
  response: {
    clientDataJSON: string;
    authenticatorData: string;
    signature: string;
    userHandle: string | null;
  };
}

/**
 * Convert WebAuthn credential to format expected by server
 */
export function formatAttestationForServer(
  credential: PublicKeyCredential,
): AttestationResult {
  const attResponse = credential.response as AuthenticatorAttestationResponse;
  const result: AttestationResult = {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(attResponse.clientDataJSON),
      attestationObject: arrayBufferToBase64url(attResponse.attestationObject),
    },
  };

  // Extract AAGUID from authenticator data (available in WebAuthn L2+)
  try {
    const attResponseL2 = attResponse as AuthenticatorAttestationResponse & {
      getAuthenticatorData?: () => ArrayBuffer;
    };
    if (typeof attResponseL2.getAuthenticatorData === "function") {
      result.aaguid = extractAaguid(attResponseL2.getAuthenticatorData());
    }
  } catch {
    // AAGUID extraction is best-effort; absence is handled gracefully upstream
  }

  // Try multiple ways to access transports
  const responseWithTransports =
    attResponse as AuthenticatorAttestationResponse & { transports?: unknown };
  if (responseWithTransports.transports) {
    result.getTransports = responseWithTransports.transports;
  } else if ("transports" in attResponse) {
    result.getTransports = responseWithTransports.transports;
  } else {
    try {
      const jsonCredential = JSON.parse(JSON.stringify(credential)) as {
        response?: { transports?: unknown };
      };
      if (jsonCredential.response && jsonCredential.response.transports) {
        result.getTransports = jsonCredential.response.transports;
      }
    } catch (err) {
      if (
        err instanceof TypeError &&
        err.message.includes("Illegal invocation")
      ) {
        // 1password and bitwarden don't have JSON serializable credentials, so need to catch the error when trying to get transports
        // Just error to console, credential can still be saved
        console.error(err);
      } else {
        throw err;
      }
    }
  }

  return result;
}

/**
 * Convert WebAuthn assertion to format expected by server
 */
export function formatAssertionForServer(
  credential: PublicKeyCredential,
): AssertionResult {
  const assResponse = credential.response as AuthenticatorAssertionResponse;
  return {
    id: credential.id,
    rawId: arrayBufferToBase64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: arrayBufferToBase64url(assResponse.clientDataJSON),
      authenticatorData: arrayBufferToBase64url(assResponse.authenticatorData),
      signature: arrayBufferToBase64url(assResponse.signature),
      userHandle: assResponse.userHandle
        ? arrayBufferToBase64url(assResponse.userHandle)
        : null,
    },
  };
}

/**
 * Register a new FIDO2 credential
 */
export async function registerFIDO2Credential(
  attestationOptions: ServerAttestationOptions,
  nickname: string | null = null,
): Promise<AttestationResult> {
  try {
    // Prepare options for WebAuthn API
    const preparedOptions = prepareAttestationOptions(attestationOptions);

    // Create credential using WebAuthn API
    const credential = await navigator.credentials.create({
      publicKey:
        preparedOptions as unknown as PublicKeyCredentialCreationOptions,
    });

    if (!credential) {
      throw new Error();
    }

    // Format for server
    const attestationResult = formatAttestationForServer(
      credential as PublicKeyCredential,
    );

    // Add nickname if provided
    if (nickname) {
      attestationResult.nickname = nickname;
    }

    return attestationResult;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Authenticate using FIDO2 credential
 */
export async function authenticateFIDO2Credential(
  assertionOptions: ServerAssertionOptions,
): Promise<AssertionResult> {
  try {
    // Prepare options for WebAuthn API
    const preparedOptions = prepareAssertionOptions(assertionOptions);

    // Get credential using WebAuthn API
    const credential = await navigator.credentials.get({
      publicKey:
        preparedOptions as unknown as PublicKeyCredentialRequestOptions,
    });

    if (!credential) {
      throw new Error();
    }

    // Format for server
    return formatAssertionForServer(credential as PublicKeyCredential);
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean {
  return !!(
    navigator.credentials &&
    typeof navigator.credentials.create === "function" &&
    typeof navigator.credentials.get === "function"
  );
}
