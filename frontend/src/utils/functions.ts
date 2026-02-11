import engJson from "../locales/en/en.json";
import frJson from "../locales/fr/fr.json";
import { AVAILABLE_LANGUAGES, FOOTERS, PROFILE_LANGUAGES } from "./constants";

interface LangValues {
  langHref: string;
  currentLang: string;
}

function getLangHref(currentLang: string, pathname: string): string {
  let newPathname = pathname.slice(1 + currentLang.length);

  if (newPathname.length > 0) newPathname = "/" + newPathname;

  if (currentLang === AVAILABLE_LANGUAGES.fr)
    return "/" + AVAILABLE_LANGUAGES.en + newPathname.replaceAll("//", "/");

  return "/" + AVAILABLE_LANGUAGES.fr + newPathname.replaceAll("//", "/");
}

export function getLanguage(language: string | undefined): string {
  const browserLanguage = navigator.languages[1];

  if (
    language === AVAILABLE_LANGUAGES.fr ||
    language === AVAILABLE_LANGUAGES.en
  )
    return language;
  else if (
    browserLanguage === AVAILABLE_LANGUAGES.fr ||
    language === AVAILABLE_LANGUAGES.en
  )
    return browserLanguage;

  return AVAILABLE_LANGUAGES.en;
}

export function getLangValues(
  language: string | undefined,
  pathname: string,
): LangValues {
  const currentLang = getLanguage(language);
  const langHref = getLangHref(currentLang, pathname);

  return { langHref, currentLang };
}

export function getPageContent(
  language: string | undefined,
  pageName: string,
): Record<string, string> | undefined {
  if (language === AVAILABLE_LANGUAGES.fr) return frJson[pageName];

  return engJson[pageName];
}

export function getContentWithVariables(
  content: string,
  variables: Record<string, string>,
): string {
  let updatedContent = content;

  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`{${key}}`, "g");
    updatedContent = updatedContent.replace(regex, variables[key]);
  });

  return updatedContent;
}

export function getFooter(language: string | undefined): string {
  if (language === AVAILABLE_LANGUAGES.fr) return FOOTERS.default.fr;

  return FOOTERS.default.en;
}

export function isEmailValid(email: string | null | undefined): boolean {
  const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return email != null && isValidEmail.test(email);
}

export function isCodeValid(code: string | null | undefined): boolean {
  const isValidCode = /^[0-9]{6}$/;

  return code != null && isValidCode.test(code);
}

export function isPasswordValid(password: string | null | undefined): boolean {
  return password != null && password.length >= 12 && password.length <= 65;
}

export function isNameValid(
  name: string | null,
  minLength: number,
): RegExpMatchArray | null | true {
  if (minLength === 0)
    if (name !== null && name.length > 0) {
      const isValidName =
        /^[a-zA-Z\-_ '']()ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]+$/;
      return isValidName.test(name)
        ? (name.match(isValidName) as RegExpMatchArray)
        : null;
    } else return true;

  const isValidName = /^[a-zA-Z\-_ '']()ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]{2,}$/;

  return name !== null && isValidName.test(name)
    ? (name.match(isValidName) as RegExpMatchArray)
    : null;
}

export function capitalizeFirstLetter(str: string | null | undefined): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(
  expirationTime: number | null | undefined,
  currentLang = "en",
): string {
  if (!expirationTime) return "0:00";

  // Normalize language
  let lang: "en" | "fr" = "en";
  if (currentLang === "fr" || currentLang === "fr-ca") lang = "fr";
  // Treat "en-ca" as English
  else if (currentLang === "en-ca") lang = "en";

  const date = new Date(expirationTime);
  return date.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function convertLanguageToLanguageCode(updatedLanguage: string): string {
  const languageKeys = Object.keys(PROFILE_LANGUAGES);

  return (
    languageKeys.find((lang) =>
      updatedLanguage.toLowerCase().startsWith(lang),
    ) || "en"
  );
}
