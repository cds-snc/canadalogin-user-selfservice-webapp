import { getPageContent } from "./functions";
import { PAGES } from "./constants";

/**
 * Utility function to generate error messages from error codes
 * @param {string} language - The language code for localization
 * @param {string} errorCode - The error code to look up
 * @returns {string} The error message or default error message
 */
export const getErrorMessage = (language, errorCode) => {
  if (!errorCode) return "";

  const errorPageJson = getPageContent(language, PAGES.error);
  return errorPageJson[errorCode] || errorPageJson["7"];
};
