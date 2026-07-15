import { describe, expect, it } from "vitest";
import { SERVICE_CANADA_CENTRE_PRINT_OPTIONS } from "../serviceCanadaCentrePrintConfig";

describe("SERVICE_CANADA_CENTRE_PRINT_OPTIONS", () => {
  it("uses standards-based typography scaling styles", () => {
    const typographyRule = SERVICE_CANADA_CENTRE_PRINT_OPTIONS.shadowStyles.find(
      (rule) =>
        rule.hosts.includes("gcds-heading") && rule.hosts.includes("gcds-text"),
    );

    expect(typographyRule).toBeDefined();
    expect(typographyRule?.css).toContain("transform: scale(0.75)");
    expect(typographyRule?.css).toContain("transform-origin: top left");
    expect(typographyRule?.css).not.toContain("zoom:");
  });

  it("keeps expected Service Canada print defaults", () => {
    expect(SERVICE_CANADA_CENTRE_PRINT_OPTIONS.printTitle).toBe("");
    expect(SERVICE_CANADA_CENTRE_PRINT_OPTIONS.hideHosts.length).toBeGreaterThan(
      0,
    );
    expect(SERVICE_CANADA_CENTRE_PRINT_OPTIONS.shadowStyles.length).toBe(3);
    expect(SERVICE_CANADA_CENTRE_PRINT_OPTIONS.printCss).toContain("@media print");
  });
});