export const TEST_USERS: Map<string, {
    emailOtp: string;
    smsOtp: string;
    voiceOtp: string;
    login: string;
}>;
export const TEST_PROTOTYPES: Map<string, {
    mobileUrl: string;
    desktopUrl: string;
}>;
export namespace TestDataUserProvider {
    let isLoading: boolean;
    namespace userData {
        let service: string;
        let language: string;
        let email: any;
        let emailLanguage: any;
        let emailValidated: boolean;
        let trxnId: any;
        let passwordSubmitted: boolean;
        let phone: any;
        let stepVerificationSent: boolean;
        let stepVerified: boolean;
        let viewPrivacy: boolean;
        let id: any;
        let otpType: any;
        let passwordValidated: boolean;
    }
    namespace userProfile {
        let id_1: string;
        export { id_1 as id };
        export let active: boolean;
        export namespace details {
            let emailVerified: boolean;
            let lastLogin: string;
            let lastMFA: string;
            let twoFactorAuthentication: boolean;
            let pwdChangedTime: string;
        }
        export let emails: {
            value: string;
            type: string;
        }[];
        export let phoneNumbers: {
            value: string;
            type: string;
        }[];
        export namespace meta {
            let created: string;
            let location: string;
            let lastModified: string;
            let resourceType: string;
        }
        export let userName: string;
        export let preferredLanguage: string;
        export namespace name {
            let givenName: string;
            let familyName: string;
            let formatted: string;
        }
    }
    namespace relyingPartyInfo {
        export let icon: string;
        let id_2: string;
        export { id_2 as id };
        export let linkName: string;
        export let url: string;
    }
    let authenticatedPages: any[];
    namespace testData {
        let email_1: any;
        export { email_1 as email };
        export let otp: any;
        let phone_1: any;
        export { phone_1 as phone };
        export let verificationCode: any;
        export let password: any;
        export let firstname: any;
        export let lastName: any;
    }
}
export namespace ACTION_TYPES {
    let link: string;
    let submit: string;
}
export namespace TEST_TYPES {
    let error: string;
    let success: string;
    let redirect: string;
}
export namespace POLICY_RESPONSE {
    let success_1: boolean;
    export { success_1 as success };
    export let message: string;
    export namespace data {
        let pwdMinLength: number;
        let pwdMaxLength: number;
    }
}
export namespace SUCCESS_RESPONSE {
    let success_2: boolean;
    export { success_2 as success };
    let message_1: string;
    export { message_1 as message };
    export namespace data_1 {
        let trxnId_1: string;
        export { trxnId_1 as trxnId };
        export let type: string;
        let created_1: string;
        export { created_1 as created };
        export let updated: string;
        export let expiry: string;
        export let state: string;
        export let correlationID: string;
        export let emailAddress: string;
        export let attempts: number;
        export let retries: number;
    }
    export { data_1 as data };
}
export namespace ERROR_RESPONSE {
    let success_3: boolean;
    export { success_3 as success };
    let message_2: string;
    export { message_2 as message };
    let data_2: any;
    export { data_2 as data };
}
export namespace PASSWORD_ERROR_RESPONSE {
    export namespace data_3 {
        let success_4: boolean;
        export { success_4 as success };
        let message_3: string;
        export { message_3 as message };
        let data_4: any;
        export { data_4 as data };
    }
    export { data_3 as data };
    export let status: number;
}
export namespace EMAIL_ERROR_RESPONSE {
    export namespace data_5 {
        let success_5: boolean;
        export { success_5 as success };
        let message_4: string;
        export { message_4 as message };
        let data_6: any;
        export { data_6 as data };
    }
    export { data_5 as data };
    let status_1: number;
    export { status_1 as status };
}
export namespace PHONE_NUMBER_ERROR_RESPONSE {
    export namespace data_7 {
        let success_6: boolean;
        export { success_6 as success };
        let message_5: string;
        export { message_5 as message };
        let data_8: any;
        export { data_8 as data };
    }
    export { data_7 as data };
    let status_2: number;
    export { status_2 as status };
}
export namespace PROFILE_ERROR_RESPONSE {
    export namespace data_9 {
        let success_7: boolean;
        export { success_7 as success };
        let message_6: string;
        export { message_6 as message };
        let data_10: any;
        export { data_10 as data };
    }
    export { data_9 as data };
    let status_3: number;
    export { status_3 as status };
}
export namespace VALIDATION_CODE_ERROR_RESPONSE {
    export namespace data_11 {
        let success_8: boolean;
        export { success_8 as success };
        let message_7: string;
        export { message_7 as message };
        let data_12: any;
        export { data_12 as data };
    }
    export { data_11 as data };
    let status_4: number;
    export { status_4 as status };
}
export namespace SERVER_TIMEOUT_RESPONSE {
    let status_5: number;
    export { status_5 as status };
}
export namespace TEST_RESPONSES {
    namespace signUpResponse {
        let success_9: boolean;
        export { success_9 as success };
        let message_8: string;
        export { message_8 as message };
        export namespace data_13 {
            let attempts_1: number;
            export { attempts_1 as attempts };
            let correlationID_1: string;
            export { correlationID_1 as correlationID };
            let created_2: string;
            export { created_2 as created };
            let emailAddress_1: string;
            export { emailAddress_1 as emailAddress };
            let expiry_1: string;
            export { expiry_1 as expiry };
            let retries_1: number;
            export { retries_1 as retries };
            let state_1: string;
            export { state_1 as state };
            let trxnId_2: string;
            export { trxnId_2 as trxnId };
            let type_1: string;
            export { type_1 as type };
            let updated_1: string;
            export { updated_1 as updated };
        }
        export { data_13 as data };
    }
    namespace verificationEmailResponse {
        let success_10: boolean;
        export { success_10 as success };
        let message_9: string;
        export { message_9 as message };
        let data_14: any;
        export { data_14 as data };
    }
    namespace passwordResponse {
        let success_11: boolean;
        export { success_11 as success };
        let message_10: string;
        export { message_10 as message };
        export namespace data_15 {
            let id_3: string;
            export { id_3 as id };
            let userName_1: string;
            export { userName_1 as userName };
        }
        export { data_15 as data };
    }
    namespace verificationSmsSetUpResponse {
        let success_12: boolean;
        export { success_12 as success };
        let message_11: string;
        export { message_11 as message };
        export namespace data_16 {
            let attempts_2: number;
            export { attempts_2 as attempts };
            let correlationID_2: string;
            export { correlationID_2 as correlationID };
            let created_3: string;
            export { created_3 as created };
            export let phoneNumber: string;
            let expiry_2: string;
            export { expiry_2 as expiry };
            let retries_2: number;
            export { retries_2 as retries };
            let state_2: string;
            export { state_2 as state };
            let trxnId_3: string;
            export { trxnId_3 as trxnId };
            let type_2: string;
            export { type_2 as type };
            let updated_2: string;
            export { updated_2 as updated };
        }
        export { data_16 as data };
    }
    namespace verificationVoiceSetUpResponse {
        let success_13: boolean;
        export { success_13 as success };
        let message_12: string;
        export { message_12 as message };
        export namespace data_17 {
            let attempts_3: number;
            export { attempts_3 as attempts };
            let correlationID_3: string;
            export { correlationID_3 as correlationID };
            let created_4: string;
            export { created_4 as created };
            let phoneNumber_1: string;
            export { phoneNumber_1 as phoneNumber };
            let expiry_3: string;
            export { expiry_3 as expiry };
            let retries_3: number;
            export { retries_3 as retries };
            let state_3: string;
            export { state_3 as state };
            let trxnId_4: string;
            export { trxnId_4 as trxnId };
            let type_3: string;
            export { type_3 as type };
            let updated_3: string;
            export { updated_3 as updated };
        }
        export { data_17 as data };
    }
    namespace verificationSmsResponse {
        let success_14: boolean;
        export { success_14 as success };
        let message_13: string;
        export { message_13 as message };
        let data_18: any;
        export { data_18 as data };
    }
    namespace verificationVoiceResponse {
        let success_15: boolean;
        export { success_15 as success };
        let message_14: string;
        export { message_14 as message };
        let data_19: any;
        export { data_19 as data };
    }
}
export namespace MSW_MOCKS {
    namespace passwordPolicy {
        let type_4: string;
        export { type_4 as type };
        export let endpoint: string;
        export { POLICY_RESPONSE as response };
    }
    namespace transientOtpSend {
        export namespace emailError {
            let type_5: string;
            export { type_5 as type };
            let endpoint_1: string;
            export { endpoint_1 as endpoint };
            export { EMAIL_ERROR_RESPONSE as response };
        }
        export namespace error_1 {
            let type_6: string;
            export { type_6 as type };
            let endpoint_2: string;
            export { endpoint_2 as endpoint };
            export { ERROR_RESPONSE as response };
        }
        export { error_1 as error };
        export namespace serverTimeOut {
            let type_7: string;
            export { type_7 as type };
            let endpoint_3: string;
            export { endpoint_3 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export namespace emailSuccess {
            let type_8: string;
            export { type_8 as type };
            let endpoint_4: string;
            export { endpoint_4 as endpoint };
            import response = TEST_RESPONSES.signUpResponse;
            export { response };
        }
        export namespace smsSuccess {
            let type_9: string;
            export { type_9 as type };
            let endpoint_5: string;
            export { endpoint_5 as endpoint };
            import response_1 = TEST_RESPONSES.verificationSmsSetUpResponse;
            export { response_1 as response };
        }
        export namespace voiceSuccess {
            let type_10: string;
            export { type_10 as type };
            let endpoint_6: string;
            export { endpoint_6 as endpoint };
            import response_2 = TEST_RESPONSES.verificationVoiceSetUpResponse;
            export { response_2 as response };
        }
        export namespace phoneError {
            let type_11: string;
            export { type_11 as type };
            let endpoint_7: string;
            export { endpoint_7 as endpoint };
            export { PHONE_NUMBER_ERROR_RESPONSE as response };
        }
    }
    namespace transientOtpVerify {
        export namespace error_2 {
            let type_12: string;
            export { type_12 as type };
            let endpoint_8: string;
            export { endpoint_8 as endpoint };
            export { VALIDATION_CODE_ERROR_RESPONSE as response };
        }
        export { error_2 as error };
        export namespace serverTimeOut_1 {
            let type_13: string;
            export { type_13 as type };
            let endpoint_9: string;
            export { endpoint_9 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_1 as serverTimeOut };
        export namespace emailSuccess_1 {
            let type_14: string;
            export { type_14 as type };
            let endpoint_10: string;
            export { endpoint_10 as endpoint };
            import response_3 = TEST_RESPONSES.verificationEmailResponse;
            export { response_3 as response };
        }
        export { emailSuccess_1 as emailSuccess };
        export namespace smsSuccess_1 {
            let type_15: string;
            export { type_15 as type };
            let endpoint_11: string;
            export { endpoint_11 as endpoint };
            import response_4 = TEST_RESPONSES.verificationSmsResponse;
            export { response_4 as response };
        }
        export { smsSuccess_1 as smsSuccess };
        export namespace voiceSuccess_1 {
            let type_16: string;
            export { type_16 as type };
            let endpoint_12: string;
            export { endpoint_12 as endpoint };
            import response_5 = TEST_RESPONSES.verificationVoiceResponse;
            export { response_5 as response };
        }
        export { voiceSuccess_1 as voiceSuccess };
    }
    namespace create {
        export namespace error_3 {
            let type_17: string;
            export { type_17 as type };
            let endpoint_13: string;
            export { endpoint_13 as endpoint };
            export { PASSWORD_ERROR_RESPONSE as response };
        }
        export { error_3 as error };
        export namespace serverTimeOut_2 {
            let type_18: string;
            export { type_18 as type };
            let endpoint_14: string;
            export { endpoint_14 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_2 as serverTimeOut };
        export namespace success_16 {
            let type_19: string;
            export { type_19 as type };
            let endpoint_15: string;
            export { endpoint_15 as endpoint };
            import response_6 = TEST_RESPONSES.passwordResponse;
            export { response_6 as response };
        }
        export { success_16 as success };
    }
    namespace login {
        export namespace error_4 {
            let type_20: string;
            export { type_20 as type };
            let endpoint_16: string;
            export { endpoint_16 as endpoint };
            export { PASSWORD_ERROR_RESPONSE as response };
        }
        export { error_4 as error };
        export namespace serverTimeOut_3 {
            let type_21: string;
            export { type_21 as type };
            let endpoint_17: string;
            export { endpoint_17 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_3 as serverTimeOut };
        export namespace success_17 {
            let type_22: string;
            export { type_22 as type };
            let endpoint_18: string;
            export { endpoint_18 as endpoint };
            import response_7 = TEST_RESPONSES.passwordResponse;
            export { response_7 as response };
        }
        export { success_17 as success };
    }
    namespace otpSend {
        export namespace error_5 {
            let type_23: string;
            export { type_23 as type };
            let endpoint_19: any;
            export { endpoint_19 as endpoint };
            export { ERROR_RESPONSE as response };
        }
        export { error_5 as error };
        export namespace serverTimeOut_4 {
            let type_24: string;
            export { type_24 as type };
            let endpoint_20: any;
            export { endpoint_20 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_4 as serverTimeOut };
        export namespace emailSuccess_2 {
            let type_25: string;
            export { type_25 as type };
            let endpoint_21: any;
            export { endpoint_21 as endpoint };
            import response_8 = TEST_RESPONSES.signUpResponse;
            export { response_8 as response };
        }
        export { emailSuccess_2 as emailSuccess };
        export namespace smsSuccess_2 {
            let type_26: string;
            export { type_26 as type };
            let endpoint_22: any;
            export { endpoint_22 as endpoint };
            import response_9 = TEST_RESPONSES.verificationSmsSetUpResponse;
            export { response_9 as response };
        }
        export { smsSuccess_2 as smsSuccess };
        export namespace voiceSuccess_2 {
            let type_27: string;
            export { type_27 as type };
            let endpoint_23: any;
            export { endpoint_23 as endpoint };
            import response_10 = TEST_RESPONSES.verificationVoiceSetUpResponse;
            export { response_10 as response };
        }
        export { voiceSuccess_2 as voiceSuccess };
    }
    namespace otpVerify {
        export namespace error_6 {
            let type_28: string;
            export { type_28 as type };
            let endpoint_24: any;
            export { endpoint_24 as endpoint };
            export { VALIDATION_CODE_ERROR_RESPONSE as response };
        }
        export { error_6 as error };
        export namespace serverTimeOut_5 {
            let type_29: string;
            export { type_29 as type };
            let endpoint_25: any;
            export { endpoint_25 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_5 as serverTimeOut };
        export namespace smsSuccess_3 {
            let type_30: string;
            export { type_30 as type };
            let endpoint_26: any;
            export { endpoint_26 as endpoint };
            import response_11 = TEST_RESPONSES.verificationSmsResponse;
            export { response_11 as response };
        }
        export { smsSuccess_3 as smsSuccess };
        export namespace voiceSuccess_3 {
            let type_31: string;
            export { type_31 as type };
            let endpoint_27: any;
            export { endpoint_27 as endpoint };
            import response_12 = TEST_RESPONSES.verificationVoiceResponse;
            export { response_12 as response };
        }
        export { voiceSuccess_3 as voiceSuccess };
    }
    namespace createCoreProfile {
        export namespace error_7 {
            let type_32: string;
            export { type_32 as type };
            let endpoint_28: string;
            export { endpoint_28 as endpoint };
            export { PROFILE_ERROR_RESPONSE as response };
        }
        export { error_7 as error };
        export namespace serverTimeOut_6 {
            let type_33: string;
            export { type_33 as type };
            let endpoint_29: string;
            export { endpoint_29 as endpoint };
            export { SERVER_TIMEOUT_RESPONSE as response };
        }
        export { serverTimeOut_6 as serverTimeOut };
        export namespace success_18 {
            let type_34: string;
            export { type_34 as type };
            let endpoint_30: string;
            export { endpoint_30 as endpoint };
            import response_13 = TEST_RESPONSES.passwordResponse;
            export { response_13 as response };
        }
        export { success_18 as success };
    }
}
