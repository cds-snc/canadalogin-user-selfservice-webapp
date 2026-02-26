/**
 * Prepare attestation options for WebAuthn API
 */
export function prepareAttestationOptions(options: any): any;
/**
 * Prepare assertion options for WebAuthn API
 */
export function prepareAssertionOptions(options: any): any;
/**
 * Convert WebAuthn credential to format expected by server
 */
export function formatAttestationForServer(credential: any): {
    id: any;
    rawId: string;
    type: any;
    response: {
        clientDataJSON: string;
        attestationObject: string;
    };
};
/**
 * Convert WebAuthn assertion to format expected by server
 */
export function formatAssertionForServer(credential: any): {
    id: any;
    rawId: string;
    type: any;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
        userHandle: string;
    };
};
/**
 * Register a new FIDO2 credential
 */
export function registerFIDO2Credential(attestationOptions: any, nickname?: any): Promise<{
    id: any;
    rawId: string;
    type: any;
    response: {
        clientDataJSON: string;
        attestationObject: string;
    };
}>;
/**
 * Authenticate using FIDO2 credential
 */
export function authenticateFIDO2Credential(assertionOptions: any): Promise<{
    id: any;
    rawId: string;
    type: any;
    response: {
        clientDataJSON: string;
        authenticatorData: string;
        signature: string;
        userHandle: string;
    };
}>;
/**
 * Check if WebAuthn is supported by the browser
 */
export function isWebAuthnSupported(): boolean;
