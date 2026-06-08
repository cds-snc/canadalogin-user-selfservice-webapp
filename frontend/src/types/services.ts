import type { ApiErrorResponse } from "./utils";

export type AuthServiceResponse<TData = unknown> = {
  success?: boolean;
  message?: string;
  data?: TData;
  [key: string]: unknown;
};

export type AuthServiceError = {
  data?: {
    message?: string;
    [key: string]: unknown;
  };
  response?: ApiErrorResponse & {
    data?: {
      message?: string;
      [key: string]: unknown;
    };
  };
  message?: string;
  [key: string]: unknown;
};

export type UserPayload = {
  userName: string;
  [key: string]: unknown;
};

export type OtpTransportType = "sms" | "voice" | "email";

export type OtpRequestPayload = {
  user_id?: string | null;
  otpType: string;
  factor_id?: string;
  destination?: string;
  phoneNumber?: string;
  userName?: string;
  otp?: string;
  trxnId?: string;
  [key: string]: unknown;
};

export type ProfileUpdatePayload = {
  [key: string]: unknown;
};

export type PasswordPayload = {
  password: string;
};

export type PasswordPolicyData = {
  pwdMinLength: number;
  pwdMaxLength: number;
  [key: string]: unknown;
};

export type LogoutResponseData = {
  redirect_url?: string;
  [key: string]: unknown;
};

export type SessionKeepAliveData = {
  expire: string;
  [key: string]: unknown;
};

export type RelyingPartyData = {
  icon: string;
  id: string;
  linkName: string;
  url: string;
  localized?: Record<string, { name: string; url: string }> | null;
  [key: string]: unknown;
};

export type PhoneNumberEntry = {
  value: string;
  type: "mobile";
};

export type UpdatePhonePayload = {
  phoneNumbers: PhoneNumberEntry[];
  otp: string;
  trxnId: string;
  otpType: Extract<OtpTransportType, "sms" | "voice">;
};

export type UpdateEmailPayload = {
  newEmailAddress: string;
  otp: string;
  trxnId: string;
  otpType: "email";
};

export type AuthServiceContract = {
  requestPasswordPolicy: () => Promise<
    AuthServiceResponse<PasswordPolicyData> | undefined
  >;
  create: (userData: UserPayload) => Promise<AuthServiceResponse | undefined>;
  transientOtpSend: (
    userData: OtpRequestPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  transientOtpVerify: (
    userData: OtpRequestPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  createCoreProfile: (
    userData: UserPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  login: (userData: UserPayload) => Promise<AuthServiceResponse | undefined>;
  otpSend: (
    userData: OtpRequestPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  otpVerify: (
    userData: OtpRequestPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  get_my_user_profile: (
    rpClientId?: string,
  ) => Promise<AuthServiceResponse | undefined>;
  update_my_user_profile: (
    editedProfile: ProfileUpdatePayload,
  ) => Promise<AuthServiceResponse | undefined>;
  update_email_with_otp: (
    newEmailAddress: string,
    otp: string,
    trxnId: string,
    otpType?: "email",
  ) => Promise<AuthServiceResponse | undefined>;
  update_phone_with_otp: (
    phoneNumber: string,
    otp: string,
    trxnId: string,
    otpType?: Extract<OtpTransportType, "sms" | "voice">,
  ) => Promise<AuthServiceResponse | undefined>;
  get_rp_info: () => Promise<AuthServiceResponse<RelyingPartyData> | undefined>;
  logout: (
    returnToPage?: string,
  ) => Promise<AuthServiceResponse<LogoutResponseData> | undefined>;
  keepAlive: () => Promise<
    AuthServiceResponse<SessionKeepAliveData> | undefined
  >;
  verifyPassword: (
    payload: PasswordPayload,
  ) => Promise<AuthServiceResponse | undefined>;
  verifyPasswordForStepup: (
    payload: PasswordPayload,
  ) => Promise<AuthServiceResponse | undefined>;
};
