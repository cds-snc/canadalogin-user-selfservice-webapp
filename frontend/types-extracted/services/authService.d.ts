export function isMobileMediaQuery(): boolean;
export namespace authService {
    function requestPasswordPolicy(): Promise<any>;
    function create(userData: any): Promise<any>;
    function transientOtpSend(userData: any): Promise<any>;
    function transientOtpVerify(userData: any): Promise<any>;
    function createCoreProfile(userData: any): Promise<any>;
    function login(userData: any): Promise<any>;
    function otpSend(userData: any): Promise<any>;
    function otpVerify(userData: any): Promise<any>;
    function get_my_user_profile(rp_client_id: any): Promise<any>;
    function update_my_user_profile(editedProfile: any): Promise<any>;
    function update_email_with_otp(newEmailAddress: any, otp: any, trxnId: any, otpType?: string): Promise<any>;
    function update_phone_with_otp(phoneNumber: any, otp: any, trxnId: any, otpType?: string): Promise<any>;
    function get_rp_info(): Promise<any>;
    function logout(): Promise<any>;
    function keepAlive(): Promise<any>;
    function verifyPassword({ password }: {
        password: any;
    }): Promise<any>;
    function verifyPasswordForStepup({ password }: {
        password: any;
    }): Promise<any>;
}
