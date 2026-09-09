import { EXTERNAL_NAVIGATION_LINKS } from "./constants";

export function getGcAccountDirectoryLink(language?: string): string {
  if (language === "fr" && EXTERNAL_NAVIGATION_LINKS.gcAccountDirectoryFR) {
    return EXTERNAL_NAVIGATION_LINKS.gcAccountDirectoryFR;
  }

  return EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory;
}

export function getParticipatingServicesLink(language?: string): string {
  if (language === "fr" && EXTERNAL_NAVIGATION_LINKS.participatingServicesFR) {
    return EXTERNAL_NAVIGATION_LINKS.participatingServicesFR;
  }

  return EXTERNAL_NAVIGATION_LINKS.participatingServices;
}
