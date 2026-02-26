export interface AttestationOptions {
  challenge?: string | ArrayBuffer | any;
  rp?: any;
  user?: any;
  pubKeyCredParams?: any[];
  timeout?: number;
  // Other fields exist per spec; keep loose for migration
}

export interface AssertionOptions {
  challenge?: string | ArrayBuffer | any;
  allowCredentials?: any[];
  timeout?: number;
  // Other fields exist per spec; keep loose for migration
}

export interface AttestationResult {
  id?: string;
  rawId?: string | ArrayBuffer;
  response?: any;
  type?: string;
}

export interface AssertionResult {
  id?: string;
  rawId?: string | ArrayBuffer;
  response?: any;
  type?: string;
}

// TODO: Replace `any` with WebAuthn-specific types (PublicKeyCredential etc.) when ready
