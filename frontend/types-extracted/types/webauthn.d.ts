export interface AttestationOptions {
    challenge?: string | ArrayBuffer | any;
    rp?: any;
    user?: any;
    pubKeyCredParams?: any[];
    timeout?: number;
}
export interface AssertionOptions {
    challenge?: string | ArrayBuffer | any;
    allowCredentials?: any[];
    timeout?: number;
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
