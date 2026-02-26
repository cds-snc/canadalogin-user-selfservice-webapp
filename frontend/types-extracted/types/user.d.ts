export interface UserData {
    service?: string | null;
    language?: string | null;
    email?: string | null;
    emailLanguage?: string | null;
    emailValidated?: boolean;
    trxnId?: string | null;
    passwordSubmitted?: boolean;
    phone?: string | null;
    stepVerificationSent?: boolean;
    stepVerified?: boolean;
    viewPrivacy?: boolean;
    id?: string | null;
    otpType?: string | null;
    passwordValidated?: boolean;
}
export interface Name {
    givenName?: string;
    familyName?: string;
    formatted?: string;
}
export interface Email {
    value: string;
    type?: string;
}
export interface PhoneNumber {
    value: string;
    type?: string;
}
export interface UserProfileDetails {
    emailVerified?: boolean;
    lastLogin?: string;
    lastMFA?: string;
    twoFactorAuthentication?: boolean;
    pwdChangedTime?: string;
}
export interface Meta {
    created?: string;
    location?: string;
    lastModified?: string;
    resourceType?: string;
}
export interface UserProfile {
    id?: string;
    active?: boolean;
    details?: UserProfileDetails;
    emails?: Email[];
    phoneNumbers?: PhoneNumber[];
    meta?: Meta;
    userName?: string;
    preferredLanguage?: string;
    name?: Name;
}
export interface RelyingPartyInfo {
    icon?: string;
    id?: string;
    linkName?: string;
    url?: string;
}
