export type FlowType =
  | "smsotp"
  | "voiceotp"
  | "email"
  | "dashboard"
  | "profile"
  | "manage";

export type NoticeType = "mfaAdded" | "mfaDeleted" | "passkeyAdded" | "passkeyDeleted";

export type Language = "en" | "fr";

export type SubmitEndPointKey =
  | "requestPasswordPolicy"
  | "create"
  | "createCoreProfile"
  | "login"
  | "transientOtpVerify"
  | "transientOtpSend"
  | "mfaEnroll"
  | "mfaSend"
  | "mfaVerify"
  | "mfaDelete"
  | "profile"
  | "profileUpdateWithOtp"
  | "rp_info"
  | "users"
  | "passwordUpdate"
  | "logout"
  | "sessionStatus"
  | "keepAlive"
  | "passwordVerify"
  | "passwordVerifyStepup";

export type PageKey = string; // when converting pages we can narrow this to a union of known keys
