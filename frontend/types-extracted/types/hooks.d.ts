export interface SubmitDataOptions {
    language: string;
    page: string;
    flow: string;
    type: string;
    endpoint: string;
    navigateTo: string;
    onError: (error: Error | string | null) => void;
}
export interface SubmitData {
    email?: string | null;
    language?: string | null;
    verificationCode?: string | null;
    password?: string | null;
    phone?: string | null;
    verificationType?: string | null;
    firstName?: string | null;
    lastName?: string | null;
}
