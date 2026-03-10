export type AppLanguage = "en" | "fr";

export type ProfileLanguageCode = "en-ca" | "fr-ca";

export type FlowType =
  | "smsotp"
  | "voiceotp"
  | "email"
  | "dashboard"
  | "profile"
  | "manage";

export type NoticeType =
  | "mfaAdded"
  | "mfaDeleted"
  | "passkeyAdded"
  | "passkeyDeleted";

export const pageIds = [
  "Verification",
  "OtpSelection",
  "Password",
  "Error",
  "ManageDashboard",
  "ProfileHome",
  "ProfileUpdateNameSuccess",
  "ProfileUpdateNameConfirmUpdate",
  "ProfileUpdateName",
  "EditProfileNamePage",
  "EnterNewPhoneNumber",
  "SecuritySettings",
  "EditLanguagePreferences",
  "EditLanguagePreferencePage",
  "ConfirmLanguageUpdate",
  "SuccessfullyUpdatedLanguage",
  "EditContactPhoneNumberPage",
  "PasswordChangedConfirmation",
  "ServicesWithAccessInfo",
  "ConfirmContactPhoneNumberUpdate",
  "SuccessfullyUpdatedContactPhoneNumber",
  "Manage2FAVerifications",
  "AddMFAPage",
  "AddMFANumber",
  "AddSecondMFA",
  "AddSecondMFAVoiceCall",
  "AddSecondMFATextMessage",
  "DeleteMFAPage",
  "DeleteMFAPhoneNumberConfirm",
  "TransientOtpSelection",
  "NoticeFactory",
  "PasswordVerification",
  "EditEmailPage",
  "EditEmailEnterEmail",
  "EmailOtpValidation",
  "EmailConfirmUpdate",
  "EmailUpdateSuccess",
  "AddFIDO2PasskeyPage",
  "AddFIDO2Passkey",
  "AddFIDO2PasskeyNickname",
  "DeleteFIDO2PasskeyPage",
  "VerifyFIDO2Passkey",
  "DeleteFIDO2PasskeyConfirm",
  "DeleteFIDO2PasskeySuccess",
] as const;

export type PageId = (typeof pageIds)[number];

export type ContentVariableValue = string | number;

export type ContentVariableMap = Record<string, ContentVariableValue>;

export type AnalyticsPayload = {
  category: string;
  action: string;
  label?: string;
};

export type RouteParams = Record<string, string | null | undefined>;

export type ApiErrorResponse = {
  status?: number;
  data?: unknown;
  [key: string]: unknown;
};

export type ApiErrorLike = {
  response?: ApiErrorResponse;
  [key: string]: unknown;
};

export type UserProfileDispatchContract = {
  setLoading: (isLoading: boolean, text?: string | null) => void;
  updateProfileSuccess: (data: unknown) => void;
  setAuthenticatedPage: (value: string) => void;
  removeAuthenticatedPage: (value: string) => void;
};
