export namespace addMFAPhoneNumberApi {
    function enrollMFA({ destination, otpType }: {
        destination: any;
        otpType: any;
    }): Promise<any>;
    function sendMFAOTP({ id, otpType }: {
        id: any;
        otpType: any;
    }): Promise<any>;
    function verifyMFAOTP({ id, trxnId, otp, otpType }: {
        id: any;
        trxnId: any;
        otp: any;
        otpType: any;
    }): Promise<any>;
}
