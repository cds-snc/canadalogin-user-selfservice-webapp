export namespace passwordUpdate {
    function firstStep(userName: any, userSelectedMfaFactor: any): Promise<any>;
    function secondStep(userOtp: any, trxId: any): Promise<any>;
    function finalStep(userOtp: any, trxId: any, password: any): Promise<any>;
}
