import i18n from "../i18n/index";
import { PAGE_NAMESPACE_MAP } from "../i18n/index";

import { AVAILABLE_LANGUAGES, FOOTERS, PROFILE_LANGUAGES } from "./constants";
import type { AppLanguage } from "../types/utils";

type PageContent = Record<string, string>;

function getLangHref(currentLang: string, pathname: string) {
  let newPathname = pathname.slice(1 + currentLang.length);

  if (newPathname.length > 0) {
    newPathname = "/" + newPathname;
  }

  if (currentLang === AVAILABLE_LANGUAGES.fr) {
    return "/" + AVAILABLE_LANGUAGES.en + newPathname.replace(/\/\//g, "/");
  }

  return "/" + AVAILABLE_LANGUAGES.fr + newPathname.replace(/\/\//g, "/");
}

export function getLanguage(language?: string | null) {
  const browserLanguage = navigator.languages[1];

  if (
    language === AVAILABLE_LANGUAGES.fr ||
    language === AVAILABLE_LANGUAGES.en
  ) {
    return language;
  } else if (
    browserLanguage === AVAILABLE_LANGUAGES.fr ||
    language === AVAILABLE_LANGUAGES.en
  ) {
    return browserLanguage;
  }

  return AVAILABLE_LANGUAGES.en;
}

export function getLangValues(language: string | undefined, pathname: string) {
  const currentLang = getLanguage(language);
  const langHref = getLangHref(currentLang, pathname);

  return { langHref, currentLang };
}

export function getPageContent(
  language: string | undefined,
  pageName: string,
): PageContent | undefined {
  const ns = PAGE_NAMESPACE_MAP[pageName];
  if (!ns) {
    return undefined;
  }

  const lng = language === AVAILABLE_LANGUAGES.fr ? "fr" : "en";
  const bundle = i18n.getResourceBundle(lng, ns) as
    | Record<string, PageContent>
    | undefined;

  return bundle?.[pageName];
}

export function getContentWithVariables(
  content: string,
  variables: Record<string, string | number>,
) {
  let updatedContent = content;

  Object.keys(variables).forEach((key) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, "g");
    updatedContent = updatedContent.replace(regex, String(variables[key]));
  });

  return updatedContent;
}

export function getFooter(language: string | undefined) {
  if (language === AVAILABLE_LANGUAGES.fr) {
    return FOOTERS.default.fr;
  }

  return FOOTERS.default.en;
}

export function isEmailValid(email: string | null | undefined) {
  const isValidEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  return email != null && email.match(isValidEmail);
}

export function isCodeValid(code: string | null | undefined) {
  const isValidCode = /^[0-9]{6}$/;

  return code != null && code.match(isValidCode);
}

export function isPasswordValid(password: string | null | undefined) {
  return password != null && password.length >= 12 && password.length <= 65;
}

export function isNameValid(name: string | null, minLength: number) {
  if (minLength === 0) {
    if (name !== null && name.length > 0) {
      const isValidName = /^[a-zA-Z\-_ ’'‘ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]+$/;
      return name.match(isValidName);
    }

    return true;
  }

  const isValidName = /^[a-zA-Z\-_ ’'‘ÀàÂâÆæÇçÉéÈèÊêËëÎîÏïÔôŒœÙùÛûÜüŸÿ]{2,}$/;

  return name !== null && name.match(isValidName);
}

export function capitalizeFirstLetter(str: string | null | undefined) {
  if (!str) {
    return "";
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function formatTime(
  expirationTime: string | number | Date | null | undefined,
  currentLang: string = "en",
) {
  if (!expirationTime) {
    return "0:00";
  }

  let lang: AppLanguage = "en";
  if (currentLang === "fr" || currentLang === "fr-ca") {
    lang = "fr";
  } else if (currentLang === "en-ca") {
    lang = "en";
  }

  const date = new Date(expirationTime);
  return date.toLocaleTimeString(lang, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function convertLanguageToLanguageCode(updatedLanguage: string) {
  const languageKeys = Object.keys(PROFILE_LANGUAGES);

  return (
    languageKeys.find((lang) =>
      updatedLanguage.toLowerCase().startsWith(lang),
    ) || "en"
  );
}
