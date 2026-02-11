import { getPageContent } from "./functions";
import { PAGES } from "./constants";

/**
 * Utility function to generate error messages from error codes
 * @param language - The language code for localization
 * @param errorCode - The error code to look up
 * @returns The error message or default error message
 */
export const getErrorMessage = (
  language: string | undefined,
  errorCode: string | undefined,
): string => {
  if (!errorCode) return "";

  const errorPageJson = getPageContent(language, PAGES.error);
  return errorPageJson?.[errorCode] || errorPageJson?.["7"] || "";
};
