export interface Fido2Credential {
    id?: string;
    name?: string;
    displayName?: string;
    enabled?: boolean;
    created?: string;
    lastModified?: string;
    meta?: Record<string, unknown> | any;
}
export interface GetUserFido2Response {
    fido2?: Fido2Credential[];
}
