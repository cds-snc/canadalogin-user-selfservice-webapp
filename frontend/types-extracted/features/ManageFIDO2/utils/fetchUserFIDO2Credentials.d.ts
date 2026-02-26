import type { Fido2Credential } from "../../../types/fido2";
export type FetchFIDO2Options = {
    setLoading: (v: boolean) => void;
    setData: (data: Fido2Credential[]) => void;
    setErrorCode?: (err: string) => void;
    onError?: (err: any) => void;
};
/**
 * Fetches user's FIDO2 credentials and handles the response
 */
export declare const fetchUserFIDO2Credentials: ({ setLoading, setData, setErrorCode, onError, }: FetchFIDO2Options) => Promise<void>;
