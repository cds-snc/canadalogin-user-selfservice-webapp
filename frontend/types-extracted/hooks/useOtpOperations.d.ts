export namespace MAP_TYPES {
    let lastFourDigits: string;
    let fullPhoneNumber: string;
}
export function useOtpOperations(userId: string, userName: string, setErrorCode: Function, fallbackNavigationPath: string, mapType?: string, mfaTrxnId?: string): {
    userPhoneFactors: any[];
    userSelectedMfaFactor: any;
    otpSentResponse: any;
    userOtpValue: string;
    localLoading: boolean;
    phoneFactorsMap: {};
    setUserPhoneFactors: import("react").Dispatch<import("react").SetStateAction<any[]>>;
    setUserSelectedMfaFactor: import("react").Dispatch<any>;
    setOtpSentResponse: import("react").Dispatch<any>;
    setUserOtpValue: import("react").Dispatch<import("react").SetStateAction<string>>;
    setLocalLoading: import("react").Dispatch<import("react").SetStateAction<boolean>>;
    handleChangeUserMfaSelection: (id: any) => void;
    handleSetUserOtpValue: (value: any) => void;
    requestOtpCode: (override: object) => Promise<void>;
    validateOtpCode: (otpValue: string, onSuccess: Function, overrideOtpType: string) => Promise<void>;
    fetchUserOtpPhoneFactors: () => any;
    createPhoneFactorsMap: (phoneFactors: any[], mapType?: string) => any;
};
