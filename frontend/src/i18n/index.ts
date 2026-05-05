import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import enCommon from "./locales/en/common.json";
import enLayout from "./locales/en/layout.json";
import enDashboard from "./locales/en/dashboard.json";
import enProfile from "./locales/en/profile.json";
import enPassword from "./locales/en/password.json";
import enVerification from "./locales/en/verification.json";
import enEmail from "./locales/en/email.json";
import enPhone from "./locales/en/phone.json";
import enLanguage from "./locales/en/language.json";
import enSecurity from "./locales/en/security.json";
import enMfa from "./locales/en/mfa.json";
import enFido2 from "./locales/en/fido2.json";
import enOtp from "./locales/en/otp.json";

import frCommon from "./locales/fr/common.json";
import frLayout from "./locales/fr/layout.json";
import frDashboard from "./locales/fr/dashboard.json";
import frProfile from "./locales/fr/profile.json";
import frPassword from "./locales/fr/password.json";
import frVerification from "./locales/fr/verification.json";
import frEmail from "./locales/fr/email.json";
import frPhone from "./locales/fr/phone.json";
import frLanguage from "./locales/fr/language.json";
import frSecurity from "./locales/fr/security.json";
import frMfa from "./locales/fr/mfa.json";
import frFido2 from "./locales/fr/fido2.json";
import frOtp from "./locales/fr/otp.json";
import enIdv from "./locales/en/idv.json";
import frIdv from "./locales/fr/idv.json";

export const NAMESPACES = [
  "common",
  "layout",
  "dashboard",
  "profile",
  "password",
  "verification",
  "email",
  "phone",
  "language",
  "security",
  "mfa",
  "fido2",
  "otp",
  "idv",
] as const;

export type I18nNamespace = (typeof NAMESPACES)[number];

/**
 * Maps each page name to its namespace, enabling dynamic lookups
 * (e.g. for Breadcrumbs which resolve page names at runtime).
 */
export const PAGE_NAMESPACE_MAP: Record<string, I18nNamespace> = {
  // common
  Button: "common",
  Error: "common",
  // layout
  TopNavBar: "layout",
  SessionManagement: "layout",
  ServicesWithAccessInfo: "layout",
  // dashboard
  ManageDashboard: "dashboard",
  // profile
  ProfileHome: "profile",
  ProfileUpdateName: "profile",
  ProfileUpdateNameConfirmUpdate: "profile",
  ProfileUpdateNameSuccess: "profile",
  // password
  Password: "password",
  PasswordChangedConfirmation: "password",
  // verification
  RegisterVerification: "verification",
  Verification: "verification",
  CheckYourEmail: "verification",
  CompleteTwoStepVerification: "verification",
  // email
  EnterNewEmail: "email",
  EditEmailEnterEmail: "email",
  EmailOtpValidation: "email",
  EmailConfirmUpdate: "email",
  EmailUpdateSuccess: "email",
  // phone
  EnterNewPhoneNumber: "phone",
  AreYouSureUpdateContactNumber: "phone",
  ConfirmContactPhoneNumberUpdate: "phone",
  SuccessfullyUpdatedContactPhoneNumber: "phone",
  // language
  EditLanguagePreferences: "language",
  ConfirmLanguageUpdate: "language",
  SuccessfullyUpdatedLanguage: "language",
  // security
  SecuritySettings: "security",
  OtpSelection: "security",
  // mfa
  Manage2FAVerifications: "mfa",
  AddMFANumber: "mfa",
  AddSecondMFAVoiceCall: "mfa",
  AddSecondMFATextMessage: "mfa",
  DeleteMFAPhoneNumberConfirm: "mfa",
  // fido2
  AddFIDO2Passkey: "fido2",
  AddFIDO2PasskeyNickname: "fido2",
  VerifyFIDO2Passkey: "fido2",
  DeleteFIDO2PasskeyConfirm: "fido2",
  DeleteFIDO2PasskeySuccess: "fido2",
  // otp
  TransientOtpSelection: "otp",
  PasswordVerification: "otp",
  NoticeFactory: "otp",
  // idv
  IdvServiceCanadaCentrePage: "idv",
};

i18n.use(initReactI18next).init({
  resources: {
    en: {
      common: enCommon,
      layout: enLayout,
      dashboard: enDashboard,
      profile: enProfile,
      password: enPassword,
      verification: enVerification,
      email: enEmail,
      phone: enPhone,
      language: enLanguage,
      security: enSecurity,
      mfa: enMfa,
      fido2: enFido2,
      otp: enOtp,
      idv: enIdv,
    },
    fr: {
      common: frCommon,
      layout: frLayout,
      dashboard: frDashboard,
      profile: frProfile,
      password: frPassword,
      verification: frVerification,
      email: frEmail,
      phone: frPhone,
      language: frLanguage,
      security: frSecurity,
      mfa: frMfa,
      fido2: frFido2,
      otp: frOtp,
      idv: frIdv,
    },
  },
  lng: "en",
  fallbackLng: "en",
  ns: NAMESPACES as unknown as string[],
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
