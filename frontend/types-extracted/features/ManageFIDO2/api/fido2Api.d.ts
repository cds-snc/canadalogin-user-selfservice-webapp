export namespace fido2Api {
    function getUserFIDO2Credentials(): Promise<any>;
    function getRegistrationDetails(registrationId: any): Promise<any>;
    function deleteRegistration(registrationId: any, assertionResult: any): Promise<any>;
    function updateRegistration(registrationId: any, updates: any): Promise<any>;
    function getAttestationOptions(): Promise<any>;
    function submitAttestationResult(attestationResult: any): Promise<any>;
    function getAssertionOptions(): Promise<any>;
    function submitAssertionResult(assertionResult: any, returnJwt?: boolean): Promise<any>;
}
