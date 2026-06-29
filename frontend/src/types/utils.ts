import type { UserProfile } from "./user";

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
  "IdvServiceCanadaCentrePage",
  "IdvVisitCanadaPostPage",
  "IdvServiceCanadaCentreCodePage",
  "IdvProofingBarcodeCanadaPostPage",
  "IdvStartIdentityProofingPage",
  "IdvProveIdentityOnlinePage",
  "IdvOnlineVerificationInfoPage",
  "IdvProvincialVerificationPage",
  "IdvDetailsConfirmationPage",
  "IdvCompleteIdentityProofingPage",
  "IdvIdentityVerificationSuccessPage",
] as const;

export type PageId = (typeof pageIds)[number];

export type ContentVariableValue = string | number;

export type ContentVariableMap = Record<string, ContentVariableValue>;

export type AnalyticsPayload = {
  category: string;
  action: string;
  label?: string;
};

export interface GA4EventParams {
  [key: string]: string | number | boolean | undefined;
}

export interface CardClickParams extends GA4EventParams {
  card_name: string;
  card_type: string;
  destination: string;
}

export interface NavigationParams extends GA4EventParams {
  from_page: string;
  to_page: string;
  link_text?: string;
}

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
  updateProfileSuccess: (data: UserProfile | null) => void;
  setAuthenticatedPage: (value: string) => void;
  removeAuthenticatedPage: (value: string) => void;
};

export interface FormStepTrackingParams extends GA4EventParams {
  form_id: string;
  page: string;
  step: string;
  post_action?: string;
  event_label?: string;
  duration_ms?: number;
  attempts?: number;
}

export interface FormApiCallParams extends GA4EventParams {
  form_id: string;
  page: string;
  step: string;
  post_action?: string;
  api_id: string;
  api_type: string;
  duration?: number;
  status?: string;
  error_id?: string;
  error_message?: string;
}

export interface AnalyticsTrackEvent {
  event: string;
  form_id: string;
  step: string;
  type?: string;
  flow?: string;
  error?: string;
  duration_ms?: number;
}
