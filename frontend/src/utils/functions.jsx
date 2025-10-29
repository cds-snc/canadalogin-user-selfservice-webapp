import engJson from "../locales/en/en.json";
import frJson from "../locales/fr/fr.json";
import { AVAILABLE_LANGUAGES, FOOTERS, PROFILE_LANGUAGES } from "./constants";

function getLangHref(currentLang, pathname) {
  let newPathname = pathname.slice(1 + currentLang.length);

  if (newPathname.length > 0) newPathname = "/" + newPathname;

  if (currentLang === AVAILABLE_LANGUAGES.fr)
    return "/" + AVAILABLE_LANGUAGES.en + newPathname.replaceAll("//", "/");

  return "/" + AVAILABLE_LANGUAGES.fr + newPathname.replaceAll("//", "/");
}

export function getLanguage(language) {
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

export function getLangValues(language, pathname) {
  const currentLang = getLanguage(language);
  const langHref = getLangHref(currentLang, pathname);

  return { langHref, currentLang };
}

export function getPageContent(language, pageName) {
  if (language === AVAILABLE_LANGUAGES.fr) return frJson[pageName];

  return engJson[pageName];
}

export function getFooter(language) {
  if (language === AVAILABLE_LANGUAGES.fr) return FOOTERS.default.fr;

  return FOOTERS.default.en;
}

export function isEmailValid(email) {
  const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return email != null && email.match(isValidEmail);
}

export function isCodeValid(code) {
  const isValidCode = /^[0-9]{6}$/;

  return code != null && code.match(isValidCode);
}

export function isPasswordValid(password) {
  return password != null && password.length >= 12 && password.length <= 65;
}

export function isNameValid(name, minLength) {
  if (minLength === 0)
    if (name !== null && name.length > 0) {
      const isValidName = /^[a-zA-Z\-_ ’'‘ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]+$/;
      return name.match(isValidName);
    } else return true;

  const isValidName = /^[a-zA-Z\-_ ’'‘ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]{2,}$/;

  return name !== null && name.match(isValidName);
}

export function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(expirationTime, currentLang = "en") {
  if (!expirationTime) return "0:00";

  // Normalize language
  let lang = "en";
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

export function convertLanguageToLanguageCode(updatedLanguage) {
  const languageKeys = Object.keys(PROFILE_LANGUAGES);

  return (
    languageKeys.find((lang) =>
      updatedLanguage.toLowerCase().startsWith(lang),
    ) || "en"
  );
}
