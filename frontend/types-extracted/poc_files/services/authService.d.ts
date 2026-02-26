export namespace authService {
    function signup(userData: any): Promise<any>;
    function signupWithMFA(userData: any): Promise<any>;
    function verifyMFATOTP(verifyData: any): Promise<any>;
    function passwordSignIn(credentials: any): Promise<any>;
    function signupWithPasskey(userData: any): Promise<any>;
    function getPasskeyRegistrationOptions(userData: any): Promise<any>;
    function verifyPasskeyRegistration(verificationData: any): Promise<any>;
    function logout(): void;
}
