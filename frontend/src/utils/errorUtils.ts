import { PAGES } from "./constants";
import { getPageContent } from "./functions";

export const getErrorMessage = (
  language: string | undefined,
  errorCode: string | null | undefined,
): string => {
  if (!errorCode) {
    return "";
  }

  const errorPageContent = getPageContent(language, PAGES.error);

  if (!errorPageContent) {
    return "";
  }

  return errorPageContent[errorCode] || errorPageContent["7"] || "";
};
