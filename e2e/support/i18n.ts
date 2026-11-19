// Assert against the app's own translation files so copy changes don't break tests.
import enIdv from "../../frontend/src/i18n/locales/en/idv.json";
import frIdv from "../../frontend/src/i18n/locales/fr/idv.json";
import enProfile from "../../frontend/src/i18n/locales/en/profile.json";
import frProfile from "../../frontend/src/i18n/locales/fr/profile.json";
import enDashboard from "../../frontend/src/i18n/locales/en/dashboard.json";
import frDashboard from "../../frontend/src/i18n/locales/fr/dashboard.json";

import { env } from "./env";

export type Language = "en" | "fr";

export const LANGUAGES: Language[] = ["en", "fr"];

export const copy = {
  en: { idv: enIdv, profile: enProfile, dashboard: enDashboard },
  fr: { idv: frIdv, profile: frProfile, dashboard: frDashboard },
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

/**
 * Same formatting as the app's date of birth (ProvenInformationCard): "December 2, 1995"
 * in English, "2 décembre 1995" in French, with "1er" for the first of the month.
 * `birthdate` is a date only (YYYY-MM-DD), so it is formatted in UTC to avoid shifting the day.
 */
export function formatBirthDate(birthdate: string, language: Language): string {
  const date = new Date(`${birthdate}T00:00:00Z`);
  const formatted = new Intl.DateTimeFormat(language, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
  return language === "fr" && date.getUTCDate() === 1
    ? formatted.replace(/^1 /, "1er ")
    : formatted;
}
