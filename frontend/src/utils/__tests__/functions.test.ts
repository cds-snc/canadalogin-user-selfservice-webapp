import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  capitalizeFirstLetter,
  convertLanguageToLanguageCode,
  formatTime,
  getContentWithVariables,
  getFooter,
  getLanguage,
  getLangValues,
  getPageContent,
  isCodeValid,
  isEmailValid,
  isNameValid,
  isPasswordValid,
} from "../functions";
import { FOOTERS } from "../constants";

describe("utils/functions", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["en-ca", "fr"],
    });
  });

  it("getLanguage returns explicit route language when valid", () => {
    expect(getLanguage("fr")).toBe("fr");
    expect(getLanguage("en")).toBe("en");
  });

  it("getLanguage falls back to browser language when route language is invalid", () => {
    expect(getLanguage("es")).toBe("fr");
  });

  it("getLanguage defaults to en when route and browser are unsupported", () => {
    Object.defineProperty(navigator, "languages", {
      configurable: true,
      value: ["en-ca", "es"],
    });

    expect(getLanguage(undefined)).toBe("en");
  });

  it("getLangValues switches URL language prefix correctly", () => {
    expect(getLangValues("en", "/en/manage")).toEqual({
      currentLang: "en",
      langHref: "/fr/manage",
    });
    expect(getLangValues("fr", "/fr")).toEqual({
      currentLang: "fr",
      langHref: "/en",
    });
  });

  it("getPageContent returns localized page content for known page names", () => {
    const enContent = getPageContent("en", "Verification");
    const frContent = getPageContent("fr", "Verification");

    expect(enContent?.checkYourPhone).toBe("Check your phone");
    expect(frContent?.checkYourPhone).toBe("Consultez votre téléphone");
  });

  it("getPageContent returns undefined for unknown page names", () => {
    expect(getPageContent("en", "DoesNotExist")).toBeUndefined();
  });

  it("getContentWithVariables replaces all placeholders", () => {
    const content =
      "Code {{code}} expires in {{minutes}} minutes. Code={{code}}";
    const result = getContentWithVariables(content, {
      code: 123456,
      minutes: 10,
    });

    expect(result).toBe("Code 123456 expires in 10 minutes. Code=123456");
  });

  it("getFooter returns localized footer JSON string", () => {
    expect(getFooter("fr")).toBe(FOOTERS.fr);
    expect(getFooter("en")).toBe(FOOTERS.en);
    expect(getFooter(undefined)).toBe(FOOTERS.en);
  });

  it("isEmailValid validates expected email formats", () => {
    expect(Boolean(isEmailValid("person@example.com"))).toBe(true);
    expect(Boolean(isEmailValid("bad-email"))).toBe(false);
    expect(Boolean(isEmailValid(undefined))).toBe(false);
  });

  it("isCodeValid validates 6-digit OTP format", () => {
    expect(Boolean(isCodeValid("123456"))).toBe(true);
    expect(Boolean(isCodeValid("12345"))).toBe(false);
    expect(Boolean(isCodeValid("12a456"))).toBe(false);
  });

  it("isPasswordValid enforces min and max length", () => {
    expect(isPasswordValid("123456789012")).toBe(true);
    expect(isPasswordValid("12345678901")).toBe(false);
    expect(isPasswordValid("x".repeat(66))).toBe(false);
    expect(isPasswordValid(null)).toBe(false);
  });

  it("isNameValid supports optional names with minLength=0", () => {
    expect(Boolean(isNameValid("Élodie", 0))).toBe(true);
    expect(Boolean(isNameValid("", 0))).toBe(true);
    expect(Boolean(isNameValid(null, 0))).toBe(true);
  });

  it("isNameValid enforces minimum length for required names", () => {
    expect(Boolean(isNameValid("Jo", 2))).toBe(true);
    expect(Boolean(isNameValid("J", 2))).toBe(false);
    expect(Boolean(isNameValid(null, 2))).toBe(false);
  });

  it("capitalizeFirstLetter handles empty and populated values", () => {
    expect(capitalizeFirstLetter("canada")).toBe("Canada");
    expect(capitalizeFirstLetter("")).toBe("");
    expect(capitalizeFirstLetter(undefined)).toBe("");
  });

  it("formatTime returns 0:00 for missing value", () => {
    expect(formatTime(null)).toBe("0:00");
  });

  it("formatTime uses fr locale for fr/fr-ca and en locale for en-ca", () => {
    const localeSpy = vi
      .spyOn(Date.prototype, "toLocaleTimeString")
      .mockReturnValue("10:15:30");

    const value = "2026-01-01T10:15:30.000Z";

    formatTime(value, "fr-ca");
    expect(localeSpy).toHaveBeenLastCalledWith("fr", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    formatTime(value, "en-ca");
    expect(localeSpy).toHaveBeenLastCalledWith("en", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });

  it("convertLanguageToLanguageCode maps localized labels to profile language keys", () => {
    expect(convertLanguageToLanguageCode("en-ca")).toBe("en");
    expect(convertLanguageToLanguageCode("fr-ca")).toBe("fr");
    expect(convertLanguageToLanguageCode("es-mx")).toBe("en");
  });
});
