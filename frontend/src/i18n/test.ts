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
import enIdv from "./locales/en/idv.json";

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
import frIdv from "./locales/fr/idv.json";

import { NAMESPACES } from "./index";

const i18nTest = i18n.createInstance();

i18nTest.use(initReactI18next).init({
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

export default i18nTest;
