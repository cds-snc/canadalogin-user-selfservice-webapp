import { describe, expect, it } from "vitest";

import { EXTERNAL_NAVIGATION_LINKS } from "../constants";
import {
  getGcAccountDirectoryLink,
  getParticipatingServicesLink,
} from "../externalLinks";

describe("utils/externalLinks", () => {
  it("returns French GC account directory URL when language is fr", () => {
    expect(getGcAccountDirectoryLink("fr")).toBe(
      EXTERNAL_NAVIGATION_LINKS.gcAccountDirectoryFR,
    );
  });

  it("returns English GC account directory URL when language is en", () => {
    expect(getGcAccountDirectoryLink("en")).toBe(
      EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory,
    );
  });

  it("falls back to English URL for unsupported languages", () => {
    expect(getGcAccountDirectoryLink("es")).toBe(
      EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory,
    );
  });

  it("falls back to English URL when language is missing", () => {
    expect(getGcAccountDirectoryLink()).toBe(
      EXTERNAL_NAVIGATION_LINKS.gcAccountDirectory,
    );
  });

  it("returns French participating-services URL when language is fr", () => {
    expect(getParticipatingServicesLink("fr")).toBe(
      EXTERNAL_NAVIGATION_LINKS.participatingServicesFR,
    );
  });

  it("returns English participating-services URL when language is en", () => {
    expect(getParticipatingServicesLink("en")).toBe(
      EXTERNAL_NAVIGATION_LINKS.participatingServices,
    );
  });

  it("falls back to English participating-services URL for unsupported languages", () => {
    expect(getParticipatingServicesLink("es")).toBe(
      EXTERNAL_NAVIGATION_LINKS.participatingServices,
    );
  });

  it("falls back to English participating-services URL when language is missing", () => {
    expect(getParticipatingServicesLink()).toBe(
      EXTERNAL_NAVIGATION_LINKS.participatingServices,
    );
  });
});
