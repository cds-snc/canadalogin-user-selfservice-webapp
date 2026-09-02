import { EXTERNAL_NAVIGATION_LINKS } from "./constants";

export function getGcAccountDirectoryLink(language?: string): string {
  if (language === "fr" && EXTERNAL_NAVIGATION_LINKS.gcAccountDirectoryFR) {
    return EXTERNAL_NAVIGATION_LINKS.gcAccountDirectoryFR;
  }

  return EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory;
}
