// Assert against the app's own translation files so copy changes don't break tests.
import enIdv from "../../frontend/src/i18n/locales/en/idv.json";
import frIdv from "../../frontend/src/i18n/locales/fr/idv.json";
import enProfile from "../../frontend/src/i18n/locales/en/profile.json";
import frProfile from "../../frontend/src/i18n/locales/fr/profile.json";

import { env } from "./env";

export type Language = "en" | "fr";

export const LANGUAGES: Language[] = ["en", "fr"];

export const copy = {
  en: { idv: enIdv, profile: enProfile },
  fr: { idv: frIdv, profile: frProfile },
} as const;

/**
 * Same formatting as the app's proven date (ProfileHome / ConfirmIdentityDetails).
 * Uses the browser's timezone (config `timezoneId`) so dates near midnight match.
 */
export function formatProvenDate(isoTime: string, language: Language): string {
  return new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: env.timezone,
  }).format(new Date(isoTime));
}
