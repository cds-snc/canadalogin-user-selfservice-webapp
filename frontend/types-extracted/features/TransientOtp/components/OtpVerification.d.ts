export default function OtpVerification({ userProfile, userSelectedMfaFactor, setUserOtpValue, userOtpValue, onBack, requestOtpCode, validateOtpCode, setErrorCode, errorMessage, onCancel, showTryAnotherWay, }: {
    userProfile: any;
    userSelectedMfaFactor: any;
    setUserOtpValue: any;
    userOtpValue: any;
    onBack: any;
    requestOtpCode: any;
    validateOtpCode: any;
    setErrorCode: any;
    errorMessage: any;
    onCancel: any;
    showTryAnotherWay?: boolean;
}): import("react/jsx-runtime").JSX.Element;
